export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Platform, ProductType } from "@prisma/client";
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

type CatalogItem = {
  itemType: "CUSTOM_SECTION_ITEM";
  id: string;
  title: string;
  slug: null;
  price: string;
  type: ProductType;
  platform: Platform;
  stock: number;
  imageUrl: string | null;
  reviewCount: number;
  sectionId?: string;
  sectionTitle?: string;
  createdAt: Date;
};

export async function GET(req: NextRequest) {
  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = catalogQuerySchema.safeParse(sp);
  if (!parsed.success) {
    return NextResponse.json({ error: "استعلام غير صالح", details: parsed.error.flatten() }, { status: 400 });
  }

  const { q, min, max, page, pageSize } = parsed.data;

  const includeCustomSectionMatches = Boolean(q);

  const [customSectionItems, matchedSections] = await Promise.all([
    prisma.customStoreSectionItem.findMany({
      where: {
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
      },
      include: {
        section: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      take: 300,
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

  const customSectionCatalogItems: CatalogItem[] = customSectionItems.map((item) => ({
    itemType: "CUSTOM_SECTION_ITEM",
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
    createdAt: item.createdAt,
  }));

  const all = [...customSectionCatalogItems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const total = all.length;
  const start = (page - 1) * pageSize;
  const paged = all.slice(start, start + pageSize);

  return NextResponse.json({
    page,
    pageSize,
    total,
    items: paged.map((item) => ({
      itemType: item.itemType,
      id: item.id,
      title: item.title,
      slug: item.slug,
      price: item.price,
      type: item.type,
      platform: item.platform,
      stock: item.stock,
      imageUrl: item.imageUrl,
      reviewCount: item.reviewCount,
      sectionId: item.sectionId ?? null,
      sectionTitle: item.sectionTitle ?? null,
    })),
    matchedSections,
  });
}
