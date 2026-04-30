export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { customStoreSectionItemPatchSchema } from "@/lib/validations/custom-store-section";

type RouteCtx = { params: { id: string; itemId: string } };
type ItemVariant = { name: string; price: number };

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = customStoreSectionItemPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const sectionId = ctx.params.id;
  const itemId = ctx.params.itemId;

  try {
    const payload = parsed.data;

    if (payload.move === "up" || payload.move === "down") {
      const ordered = await prisma.customStoreSectionItem.findMany({
        where: { sectionId },
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      });
      const idx = ordered.findIndex((item) => item.id === itemId);
      if (idx === -1) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

      const swapWith = payload.move === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= ordered.length) return NextResponse.json({ ok: true });

      const a = ordered[idx]!;
      const b = ordered[swapWith]!;
      await prisma.$transaction([
        prisma.customStoreSectionItem.update({ where: { id: a.id }, data: { position: b.position } }),
        prisma.customStoreSectionItem.update({ where: { id: b.id }, data: { position: a.position } }),
      ]);
      return NextResponse.json({ ok: true });
    }

    const data: Prisma.CustomStoreSectionItemUpdateInput = {};
    if (typeof payload.title === "string") data.title = payload.title.trim();
    if (payload.subtitle !== undefined) data.subtitle = payload.subtitle ?? null;
    if (typeof payload.imageUrl === "string") data.imageUrl = payload.imageUrl;
    if (typeof payload.price === "number") data.price = new Prisma.Decimal(payload.price);
    if (payload.oldPrice !== undefined) {
      data.oldPrice = payload.oldPrice == null ? null : new Prisma.Decimal(payload.oldPrice);
    }
    if (typeof payload.stock === "number") data.stock = payload.stock;
    if (typeof payload.isActive === "boolean") data.isActive = payload.isActive;
    if (typeof payload.hasVariants === "boolean") {
      (data as Prisma.CustomStoreSectionItemUpdateInput & { hasVariants?: boolean }).hasVariants = payload.hasVariants;
      if (!payload.hasVariants) {
        (data as Prisma.CustomStoreSectionItemUpdateInput & { variants?: ItemVariant[] }).variants = [];
      }
    }
    if (payload.variants !== undefined) {
      const variants = payload.hasVariants === false
        ? []
        : payload.variants.map((variant) => ({ name: variant.name.trim(), price: variant.price })) as ItemVariant[];
      (data as Prisma.CustomStoreSectionItemUpdateInput & { variants?: ItemVariant[] }).variants = variants;
    }
    if (typeof payload.position === "number") data.position = payload.position;

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: "لا يوجد شيء للتحديث" }, { status: 400 });
    }

    const updated = await prisma.customStoreSectionItem.updateMany({
      where: { id: itemId, sectionId },
      data,
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json({ error: "لا يمكن التعديل الآن لأن migration لم يتم تطبيقه بعد." }, { status: 503 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }
    throw e;
  }
}

export async function DELETE(_: NextRequest, ctx: RouteCtx) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const deleted = await prisma.customStoreSectionItem.deleteMany({
      where: { id: ctx.params.itemId, sectionId: ctx.params.id },
    });
    if (deleted.count === 0) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json({ error: "لا يمكن الحذف الآن لأن migration لم يتم تطبيقه بعد." }, { status: 503 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }
    throw e;
  }
}
