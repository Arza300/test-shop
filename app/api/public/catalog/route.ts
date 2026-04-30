export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Platform, ProductType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveImageUrlForClient } from "@/lib/image-url";
import { z } from "zod";

const catalogQuerySchema = z.object({
  q: z.string().max(200).optional(),
  min: z.coerce.number().min(0).optional(),
  max: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});

function buildCatalogItemWhere(q: string | undefined, min: number | undefined, max: number | undefined): Prisma.CustomStoreSectionItemWhereInput {
  return {
    isActive: true,
    section: {
      isVisible: true,
    },
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { subtitle: { contains: q, mode: "insensitive" } },
            { section: { title: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(min !== undefined || max !== undefined
      ? {
          price: {
            ...(min !== undefined ? { gte: min } : {}),
            ...(max !== undefined ? { lte: max } : {}),
          },
        }
      : {}),
  };
}

export async function GET(req: NextRequest) {
  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = catalogQuerySchema.safeParse(sp);
  if (!parsed.success) {
    return NextResponse.json({ error: "استعلام غير صالح", details: parsed.error.flatten() }, { status: 400 });
  }

  const { q, min, max, page, pageSize } = parsed.data;

  const includeCustomSectionMatches = Boolean(q);
  const itemWhere = buildCatalogItemWhere(q, min, max);
  const skip = (page - 1) * pageSize;

  const [total, customSectionItems, matchedSections] = await Promise.all([
    prisma.customStoreSectionItem.count({ where: itemWhere }),
    prisma.customStoreSectionItem.findMany({
      where: itemWhere,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        section: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),
    includeCustomSectionMatches
      ? prisma.customStoreSection.findMany({
          where: {
            isVisible: true,
            title: { contains: q, mode: "insensitive" },
          },
          select: {
            id: true,
            title: true,
          },
          orderBy: [{ position: "asc" }, { createdAt: "desc" }],
          take: 6,
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    page,
    pageSize,
    total,
    items: customSectionItems.map((item) => ({
      itemType: "CUSTOM_SECTION_ITEM" as const,
      id: item.id,
      title: item.title,
      slug: null,
      price: item.price.toString(),
      type: ProductType.GIFT_CARD,
      platform: Platform.OTHER,
      stock: item.stock,
      imageUrl: resolveImageUrlForClient(item.imageUrl) ?? item.imageUrl,
      reviewCount: 0,
      sectionId: item.section.id,
      sectionTitle: item.section.title,
    })),
    matchedSections,
  });
}
