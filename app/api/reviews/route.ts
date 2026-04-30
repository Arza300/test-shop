export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { reviewSchema } from "@/lib/validations/review";

export async function POST(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;
  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }
  const { productId, rating, comment } = parsed.data;
  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product) return NextResponse.json({ error: "المنتج غير موجود" }, { status: 404 });
  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: session!.user.id } },
  });
  if (existing) {
    const updated = await prisma.review.update({
      where: { id: existing.id },
      data: { rating, comment: comment || null },
    });
    return NextResponse.json({ id: updated.id });
  }
  const r = await prisma.review.create({
    data: { productId, userId: session!.user.id, rating, comment: comment || null },
  });
  return NextResponse.json({ id: r.id });
}
