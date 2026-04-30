export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { resolveImageUrlForClient } from "@/lib/image-url";

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

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const rows = await prisma.homeHeroSlide.findMany({
    orderBy: { position: "asc" },
    select: {
      id: true,
      imageUrl: true,
      position: true,
      headline: true,
      subline: true,
      linkedProductId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const items = rows.map((row) => ({
    ...row,
    imageUrl: resolveImageUrlForClient(row.imageUrl) ?? row.imageUrl,
  }));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "جسم الطلب غير صالح" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "جسم الطلب مطلوب" }, { status: 400 });
  }
  const { imageUrl, headline, subline, linkedProductId } = body as {
    imageUrl?: unknown;
    headline?: unknown;
    subline?: unknown;
    linkedProductId?: unknown;
  };
  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    return NextResponse.json({ error: "رابط الصورة مطلوب" }, { status: 400 });
  }
  let linkedProductIdValue: string | null = null;
  try {
    linkedProductIdValue = await resolveValidLinkedProductId(linkedProductId);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ربط المنتج غير صالح" },
      { status: 400 }
    );
  }
  const agg = await prisma.homeHeroSlide.aggregate({ _max: { position: true } });
  const nextPos = (agg._max.position ?? -1) + 1;
  const row = await prisma.homeHeroSlide.create({
    data: {
      imageUrl: imageUrl.trim(),
      position: nextPos,
      headline:
        typeof headline === "string" && headline.trim() ? headline.trim() : null,
      subline: typeof subline === "string" && subline.trim() ? subline.trim() : null,
      linkedProductId: linkedProductIdValue,
    },
  });
  return NextResponse.json(row);
}
