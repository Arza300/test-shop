export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { brandCreateSchema } from "@/lib/validations/brand";
import { resolveImageUrlForClient } from "@/lib/image-url";

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const items = await prisma.brand.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      take: 500,
    });
    return NextResponse.json({
      items: items.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: resolveImageUrlForClient(b.logoUrl) ?? b.logoUrl,
        isVisible: b.isVisible,
        position: b.position,
      })),
    });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json({
        items: [],
        needsMigration: true,
        message: "جدول العلامات التجارية غير موجود بعد. شغّل Prisma migration لتفعيل القسم.",
      });
    }
    throw e;
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = brandCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    const agg = await prisma.brand.aggregate({ _max: { position: true } });
    const position = data.position ?? (agg._max.position ?? -1) + 1;

    const brand = await prisma.$transaction(async (tx) => {
      const b = await tx.brand.create({
        data: {
          name: data.name.trim(),
          slug: data.slug.trim(),
          logoUrl: data.logoUrl.trim(),
          isVisible: data.isVisible,
          position,
        },
      });
      return b;
    });

    return NextResponse.json({ id: brand.id });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json(
        { error: "لا يمكن إضافة علامة الآن لأن migration قاعدة البيانات لم يتم تطبيقه بعد." },
        { status: 503 }
      );
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "المسار (slug) مستخدم بالفعل" }, { status: 409 });
    }
    throw e;
  }
}
