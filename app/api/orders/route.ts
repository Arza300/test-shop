export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Prisma, OrderStatus, Role, SellableItemType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validations/order";
import { isStripeConfigured, createPaymentIntentStub } from "@/lib/payment/stripe";

function parseItemVariants(raw: unknown): Array<{ name: string; price: Prisma.Decimal }> {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((variant) => {
    if (!variant || typeof variant !== "object") return [];
    const value = variant as { name?: unknown; price?: unknown };
    if (typeof value.name !== "string" || !value.name.trim()) return [];
    if (typeof value.price === "number") return [{ name: value.name.trim(), price: new Prisma.Decimal(value.price) }];
    if (typeof value.price === "string" && value.price.trim()) {
      return [{ name: value.name.trim(), price: new Prisma.Decimal(value.price) }];
    }
    return [];
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  const isAdmin = session.user.role === Role.ADMIN;
  const orders = await prisma.order.findMany({
    where: isAdmin ? {} : { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true, name: true } },
      paymentMethod: { select: { id: true, name: true, phoneNumber: true, supportNumber: true } },
      items: { include: { product: { select: { title: true, slug: true } } } },
    },
    take: 200,
  });
  const customItemIds = orders.flatMap((order) =>
    order.items.filter((item) => item.itemType === "CUSTOM_SECTION_ITEM").map((item) => item.itemId)
  );
  const uniqueCustomItemIds = Array.from(new Set(customItemIds));
  const customItems = uniqueCustomItemIds.length
    ? await prisma.customStoreSectionItem.findMany({
        where: { id: { in: uniqueCustomItemIds } },
        select: {
          id: true,
          section: { select: { title: true } },
        },
      })
    : [];
  const customItemSectionById = new Map(customItems.map((item) => [item.id, item.section.title]));
  return NextResponse.json({
    items: orders.map((o) => ({
      id: o.id,
      status: o.status,
      total: o.total.toString(),
      createdAt: o.createdAt,
      userId: o.userId,
      user: o.user,
      paymentMethod: o.paymentMethod,
      items: o.items.map((i) => ({
        id: i.id,
        itemType: i.itemType,
        itemId: i.itemId,
        sectionTitle: i.itemType === "CUSTOM_SECTION_ITEM" ? customItemSectionById.get(i.itemId) ?? null : null,
        title: i.titleSnapshot,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toString(),
        product: i.product ? { title: i.product.title, slug: i.product.slug } : null,
      })),
    })),
  });
}

export async function POST(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;
  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;
  const paymentMethod = await prisma.paymentMethod.findFirst({
    where: { id: data.paymentMethodId, isActive: true },
    select: { id: true },
  });
  if (!paymentMethod) {
    return NextResponse.json({ error: "طريقة الدفع المختارة غير متاحة حالياً" }, { status: 400 });
  }
  const dedup = new Map<string, { itemType: SellableItemType; itemId: string; variantName?: string; quantity: number }>();
  for (const line of data.items) {
    const key = `${line.itemType}:${line.itemId}:${line.variantName ?? ""}`;
    const prev = dedup.get(key);
    dedup.set(key, {
      itemType: line.itemType,
      itemId: line.itemId,
      variantName: line.variantName,
      quantity: (prev?.quantity ?? 0) + line.quantity,
    });
  }
  const lines = Array.from(dedup.values());

  const customSectionItemIds = lines.filter((i) => i.itemType === "CUSTOM_SECTION_ITEM").map((i) => i.itemId);

  const customSectionItems = customSectionItemIds.length
    ? await prisma.customStoreSectionItem.findMany({
        where: { id: { in: customSectionItemIds }, isActive: true, section: { isVisible: true } },
      })
    : [];
  if (customSectionItems.length !== customSectionItemIds.length) {
    return NextResponse.json({ error: "عنصر أو أكثر غير متاح" }, { status: 400 });
  }

  const customSectionItemsById = new Map(customSectionItems.map((item) => [item.id, item]));

  let total = new Prisma.Decimal(0);
  for (const line of lines) {
    const customSectionItem = customSectionItemsById.get(line.itemId);
    if (!customSectionItem) {
      return NextResponse.json({ error: "عنصر أو أكثر غير متاح" }, { status: 400 });
    }
    const itemWithVariants = customSectionItem as typeof customSectionItem & { hasVariants?: boolean; variants?: unknown };
    const stock = customSectionItem?.stock;
    if (stock == null || stock < line.quantity) {
      return NextResponse.json({ error: "مخزون غير كافٍ", itemType: line.itemType, itemId: line.itemId }, { status: 400 });
    }
    let unitPrice = new Prisma.Decimal(customSectionItem.price);
    if (itemWithVariants.hasVariants) {
      if (!line.variantName) {
        return NextResponse.json({ error: "يجب تحديد نوع المنتج", itemType: line.itemType, itemId: line.itemId }, { status: 400 });
      }
      const variant = parseItemVariants(itemWithVariants.variants).find((item) => item.name === line.variantName);
      if (!variant) {
        return NextResponse.json({ error: "النوع المحدد غير متاح", itemType: line.itemType, itemId: line.itemId }, { status: 400 });
      }
      unitPrice = variant.price;
    }
    total = total.add(unitPrice.mul(line.quantity));
  }
  if (isStripeConfigured()) {
    try {
      await createPaymentIntentStub({ amountCents: Math.round(Number(total) * 100), orderId: "pending" });
    } catch {
      // stub only
    }
  }
  const order = await prisma.$transaction(async (tx) => {
    const o = await tx.order.create({
      data: {
        userId: session!.user.id,
        paymentMethodId: paymentMethod.id,
        status: OrderStatus.PENDING,
        total,
        // Shipping fields are kept as defaults for backwards compatibility with current schema.
        shippingName: session!.user.name || "عميل المتجر",
        shippingLine1: "N/A",
        shippingLine2: null,
        shippingCity: "N/A",
        shippingPostal: "N/A",
        shippingCountry: "EG",
        notes: null,
        items: {
          create: lines.map((line) => {
            const customSectionItem =
              line.itemType === "CUSTOM_SECTION_ITEM" ? customSectionItemsById.get(line.itemId)! : null;
            const itemWithVariants =
              customSectionItem == null ? null : (customSectionItem as typeof customSectionItem & { hasVariants?: boolean; variants?: unknown });
            const variant =
              itemWithVariants && itemWithVariants.hasVariants && line.variantName
                ? parseItemVariants(itemWithVariants.variants).find((item) => item.name === line.variantName)
                : null;
            return {
              itemType: line.itemType,
              itemId: line.itemId,
              titleSnapshot: customSectionItem ? `${customSectionItem.title}${line.variantName ? ` - ${line.variantName}` : ""}` : "عنصر متجر",
              productId: null,
              quantity: line.quantity,
              unitPrice: variant?.price ?? customSectionItem?.price ?? 0,
            };
          }),
        },
      },
    });
    for (const line of lines) {
      await tx.customStoreSectionItem.update({
        where: { id: line.itemId },
        data: { stock: { decrement: line.quantity } },
      });
    }
    return o;
  });
  return NextResponse.json({ id: order.id, total: order.total.toString() });
}
