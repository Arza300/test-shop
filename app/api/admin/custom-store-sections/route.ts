export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { customStoreSectionInputSchema } from "@/lib/validations/custom-store-section";
import { resolveImageUrlForClient } from "@/lib/image-url";

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

function isMissingShowTitleColumnError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022" &&
    typeof error.meta?.column === "string" &&
    error.meta.column.includes("showTitle")
  );
}

function serializeSection(section: {
  id: string;
  title: string;
  showTitle?: boolean;
  logoUrl: string | null;
  logoTitle: string | null;
  logoDescription: string | null;
  backgroundColor: string | null;
  cardBackgroundColor: string | null;
  isVisible: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    sectionId: string;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    price: Prisma.Decimal;
    oldPrice: Prisma.Decimal | null;
    hasVariants?: boolean;
    variants?: Prisma.JsonValue | null;
    stock: number;
    isActive: boolean;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
}) {
  return {
    ...section,
    showTitle: section.showTitle ?? true,
    logoUrl: section.logoUrl ? resolveImageUrlForClient(section.logoUrl) ?? section.logoUrl : null,
    items: section.items.map((item) => ({
      ...item,
      imageUrl: resolveImageUrlForClient(item.imageUrl) ?? item.imageUrl,
      price: item.price.toString(),
      oldPrice: item.oldPrice?.toString() ?? null,
      hasVariants: item.hasVariants ?? false,
      variants: Array.isArray(item.variants)
        ? item.variants.flatMap((variant) => {
            if (!variant || typeof variant !== "object") return [];
            const value = variant as { name?: unknown; price?: unknown };
            if (typeof value.name !== "string") return [];
            if (typeof value.price === "number") return [{ name: value.name, price: value.price.toFixed(2) }];
            if (typeof value.price === "string" && value.price.trim()) return [{ name: value.name, price: value.price }];
            return [];
          })
        : [],
    })),
  };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    try {
      const sections = await prisma.customStoreSection.findMany({
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
        include: {
          items: {
            orderBy: [{ position: "asc" }, { createdAt: "desc" }],
          },
        },
        take: 200,
      });
      return NextResponse.json({ items: sections.map(serializeSection) });
    } catch (error) {
      if (!isMissingShowTitleColumnError(error)) throw error;
      const sections = await prisma.customStoreSection.findMany({
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          logoUrl: true,
          logoTitle: true,
          logoDescription: true,
          backgroundColor: true,
          cardBackgroundColor: true,
          isVisible: true,
          position: true,
          createdAt: true,
          updatedAt: true,
          items: {
            orderBy: [{ position: "asc" }, { createdAt: "desc" }],
          },
        },
        take: 200,
      });
      return NextResponse.json({ items: sections.map((section) => serializeSection({ ...section, showTitle: true })) });
    }
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json({
        items: [],
        needsMigration: true,
        message: "جدول الأقسام المخصصة غير موجود بعد. شغّل Prisma migration لتفعيل القسم.",
      });
    }
    throw e;
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = customStoreSectionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = parsed.data;
    const maxPosition = await prisma.customStoreSection.aggregate({
      _max: { position: true },
    });
    const position = data.position ?? (maxPosition._max.position ?? -1) + 1;

    const createData: Record<string, unknown> = {
      title: data.title.trim(),
      logoUrl: data.logoUrl ?? null,
      logoTitle: data.logoTitle ?? null,
      logoDescription: data.logoDescription ?? null,
      backgroundColor: data.backgroundColor ?? null,
      cardBackgroundColor: data.cardBackgroundColor ?? null,
      isVisible: data.isVisible,
      position,
      showTitle: data.showTitle,
    };
    let section;
    try {
      section = await prisma.customStoreSection.create({
        data: createData as Prisma.CustomStoreSectionUncheckedCreateInput,
      });
    } catch (error) {
      if (!isMissingShowTitleColumnError(error)) throw error;
      const { showTitle: _ignored, ...fallbackData } = createData;
      section = await prisma.customStoreSection.create({
        data: fallbackData as Prisma.CustomStoreSectionUncheckedCreateInput,
      });
    }

    return NextResponse.json({ id: section.id });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json(
        { error: "لا يمكن إضافة قسم الآن لأن migration قاعدة البيانات لم يتم تطبيقه بعد." },
        { status: 503 }
      );
    }
    throw e;
  }
}
