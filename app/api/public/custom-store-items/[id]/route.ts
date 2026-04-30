export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveImageUrlForClient } from "@/lib/image-url";

type RouteCtx = {
  params: { id: string };
};

function serializeVariants(raw: unknown): Array<{ name: string; price: string }> {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((variant) => {
    if (!variant || typeof variant !== "object") return [];
    const value = variant as { name?: unknown; price?: unknown };
    if (typeof value.name !== "string") return [];
    if (typeof value.price === "number") return [{ name: value.name, price: value.price.toFixed(2) }];
    if (typeof value.price === "string" && value.price.trim()) return [{ name: value.name, price: value.price }];
    return [];
  });
}

export async function GET(_: Request, ctx: RouteCtx) {
  const item = await prisma.customStoreSectionItem.findFirst({
    where: {
      id: ctx.params.id,
      isActive: true,
      section: {
        isVisible: true,
      },
    },
    include: {
      section: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  }
  const itemWithVariants = item as typeof item & { hasVariants?: boolean; variants?: unknown };

  return NextResponse.json({
    id: item.id,
    sectionId: item.section.id,
    sectionTitle: item.section.title,
    title: item.title,
    subtitle: item.subtitle,
    imageUrl: resolveImageUrlForClient(item.imageUrl) ?? item.imageUrl,
    price: item.price.toString(),
    oldPrice: item.oldPrice?.toString() ?? null,
    hasVariants: itemWithVariants.hasVariants ?? false,
    variants: serializeVariants(itemWithVariants.variants),
    stock: item.stock,
  });
}
