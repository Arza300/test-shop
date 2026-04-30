export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

type RouteCtx = { params: { id: string } };

async function resolveValidLinkedProductId(value: unknown): Promise<string | null> {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const linkedProductId = value.trim();
  if (!linkedProductId) return null;
  const product = await prisma.customStoreSectionItem.findFirst({
    where: {
      id: linkedProductId,
      isActive: true,
      section: { isVisible: true },
    },
    select: { id: true },
  });
  if (!product) {
    throw new Error("المنتج المحدد غير صالح أو غير متاح للعرض");
  }
  return product.id;
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = ctx.params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "جسم الطلب غير صالح" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "جسم الطلب مطلوب" }, { status: 400 });
  }

  const move = (body as { move?: unknown }).move;
  if (move === "up" || move === "down") {
    const ordered = await prisma.homeHeroSlide.findMany({ orderBy: { position: "asc" } });
    const idx = ordered.findIndex((r) => r.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }
    const swapWith = move === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= ordered.length) {
      return NextResponse.json({ ok: true });
    }
    const a = ordered[idx]!;
    const b = ordered[swapWith]!;
    await prisma.$transaction([
      prisma.homeHeroSlide.update({ where: { id: a.id }, data: { position: b.position } }),
      prisma.homeHeroSlide.update({ where: { id: b.id }, data: { position: a.position } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const { headline, subline, imageUrl, linkedProductId } = body as {
    headline?: unknown;
    subline?: unknown;
    imageUrl?: unknown;
    linkedProductId?: unknown;
  };
  const data: {
    headline?: string | null;
    subline?: string | null;
    imageUrl?: string;
    linkedProductId?: string | null;
  } = {};
  if ("headline" in body) {
    data.headline =
      typeof headline === "string" && headline.trim() ? headline.trim() : null;
  }
  if ("subline" in body) {
    data.subline = typeof subline === "string" && subline.trim() ? subline.trim() : null;
  }
  if ("imageUrl" in body) {
    if (typeof imageUrl !== "string" || !imageUrl.trim()) {
      return NextResponse.json({ error: "رابط الصورة غير صالح" }, { status: 400 });
    }
    data.imageUrl = imageUrl.trim();
  }
  if ("linkedProductId" in body) {
    try {
      data.linkedProductId = await resolveValidLinkedProductId(linkedProductId);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "ربط المنتج غير صالح" },
        { status: 400 }
      );
    }
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "لا يوجد شيء للتحديث" }, { status: 400 });
  }
  try {
    const row = await prisma.homeHeroSlide.update({ where: { id }, data });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteCtx) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = ctx.params;
  try {
    await prisma.homeHeroSlide.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }
}
