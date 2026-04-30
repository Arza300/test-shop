export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { customStoreSectionItemInputSchema } from "@/lib/validations/custom-store-section";
import { resolveImageUrlForClient } from "@/lib/image-url";

type RouteCtx = { params: { id: string } };
type ItemVariant = { name: string; price: number };

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

function serializeItem(item: {
  id: string;
  sectionId: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  price: Prisma.Decimal;
  oldPrice: Prisma.Decimal | null;
  stock: number;
  isActive: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  const rawItem = item as typeof item & { hasVariants?: boolean; variants?: Prisma.JsonValue | null };
  const variants = Array.isArray(rawItem.variants)
    ? rawItem.variants.flatMap((variant) => {
        if (!variant || typeof variant !== "object") return [];
        const value = variant as { name?: unknown; price?: unknown };
        if (typeof value.name !== "string") return [];
        const price =
          typeof value.price === "number"
            ? value.price.toFixed(2)
            : typeof value.price === "string"
              ? value.price
              : null;
        if (!price) return [];
        return [{ name: value.name, price }];
      })
    : [];
  return {
    ...item,
    imageUrl: resolveImageUrlForClient(item.imageUrl) ?? item.imageUrl,
    price: item.price.toString(),
    oldPrice: item.oldPrice?.toString() ?? null,
    hasVariants: rawItem.hasVariants ?? false,
    variants,
  };
}

export async function GET(_: Request, ctx: RouteCtx) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const rows = await prisma.customStoreSectionItem.findMany({
      where: { sectionId: ctx.params.id },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      take: 500,
    });

    return NextResponse.json({ items: rows.map(serializeItem) });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json({ items: [], needsMigration: true }, { status: 200 });
    }
    throw e;
  }
}

export async function POST(req: Request, ctx: RouteCtx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = customStoreSectionItemInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const section = await prisma.customStoreSection.findUnique({ where: { id: ctx.params.id } });
    if (!section) return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });

    const data = parsed.data;
    const variants: ItemVariant[] = data.hasVariants
      ? data.variants.map((variant) => ({ name: variant.name.trim(), price: variant.price }))
      : [];
    const maxPosition = await prisma.customStoreSectionItem.aggregate({
      where: { sectionId: ctx.params.id },
      _max: { position: true },
    });
    const position = data.position ?? (maxPosition._max.position ?? -1) + 1;

    const row = await prisma.customStoreSectionItem.create({
      data: {
        sectionId: ctx.params.id,
        title: data.title.trim(),
        subtitle: data.subtitle ?? null,
        imageUrl: data.imageUrl,
        price: new Prisma.Decimal(data.price),
        oldPrice: data.oldPrice != null ? new Prisma.Decimal(data.oldPrice) : null,
        stock: data.stock,
        isActive: data.isActive,
        position,
      } as Prisma.CustomStoreSectionItemUncheckedCreateInput,
    });
    if (data.hasVariants || variants.length) {
      await prisma.customStoreSectionItem.update({
        where: { id: row.id },
        data: { hasVariants: data.hasVariants, variants } as Prisma.CustomStoreSectionItemUpdateInput,
      });
    }

    return NextResponse.json({ id: row.id });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json(
        { error: "لا يمكن إضافة عنصر الآن لأن migration قاعدة البيانات لم يتم تطبيقه بعد." },
        { status: 503 }
      );
    }
    throw e;
  }
}
