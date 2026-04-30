export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { resolveImageUrlForClient } from "@/lib/image-url";

const PANEL_ID = "main";

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

async function resolveValidLinkedSectionId(value: unknown): Promise<string | null> {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const linkedSectionId = value.trim();
  if (!linkedSectionId) return null;
  const section = await prisma.customStoreSection.findFirst({
    where: {
      id: linkedSectionId,
      isVisible: true,
      items: { some: { isActive: true } },
    },
    select: { id: true },
  });
  if (!section) {
    throw new Error("القسم المحدد غير صالح أو غير متاح للعرض");
  }
  return section.id;
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const row = await prisma.homeHeroSidePanel.findUnique({ where: { id: PANEL_ID } });
  return NextResponse.json({
    imageUrl: row?.imageUrl ? resolveImageUrlForClient(row.imageUrl) ?? row.imageUrl : null,
    linkedProductId: row?.linkedProductId ?? null,
    linkedSectionId: row?.linkedSectionId ?? null,
  });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "??? ????? ??? ????" }, { status: 400 });
  }

  const { imageUrl, linkedProductId, linkedSectionId } = body as {
    imageUrl?: unknown;
    linkedProductId?: unknown;
    linkedSectionId?: unknown;
  };

  const hasImageUrl = "imageUrl" in (body as Record<string, unknown>);
  const hasLinkedProductId = "linkedProductId" in (body as Record<string, unknown>);
  const hasLinkedSectionId = "linkedSectionId" in (body as Record<string, unknown>);
  if (!hasImageUrl && !hasLinkedProductId && !hasLinkedSectionId) {
    return NextResponse.json({ error: "لا يوجد شيء للتحديث" }, { status: 400 });
  }
  if (hasLinkedProductId && hasLinkedSectionId) {
    return NextResponse.json({ error: "اختر ربطًا واحدًا فقط: منتج أو قسم" }, { status: 400 });
  }

  const data: {
    imageUrl?: string | null;
    linkedProductId?: string | null;
    linkedSectionId?: string | null;
  } = {};
  if (hasImageUrl) {
    if (imageUrl == null || imageUrl === "") {
      data.imageUrl = null;
    } else if (typeof imageUrl === "string" && imageUrl.trim()) {
      data.imageUrl = imageUrl.trim();
    } else {
      return NextResponse.json({ error: "رابط الصورة غير صالح" }, { status: 400 });
    }
  }
  try {
    if (hasLinkedProductId) {
      data.linkedProductId = await resolveValidLinkedProductId(linkedProductId);
      data.linkedSectionId = null;
    } else if (hasLinkedSectionId) {
      data.linkedSectionId = await resolveValidLinkedSectionId(linkedSectionId);
      data.linkedProductId = null;
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "الربط غير صالح" }, { status: 400 });
  }

  const row = await prisma.homeHeroSidePanel.upsert({
    where: { id: PANEL_ID },
    update: data,
    create: {
      id: PANEL_ID,
      imageUrl: data.imageUrl ?? null,
      linkedProductId: data.linkedProductId ?? null,
      linkedSectionId: data.linkedSectionId ?? null,
    },
  });

  return NextResponse.json({
    imageUrl: resolveImageUrlForClient(row.imageUrl) ?? row.imageUrl,
    linkedProductId: row.linkedProductId,
    linkedSectionId: row.linkedSectionId,
  });
}

export async function DELETE() {
  const { error } = await requireAdmin();
  if (error) return error;

  await prisma.homeHeroSidePanel.upsert({
    where: { id: PANEL_ID },
    update: { imageUrl: null, linkedProductId: null, linkedSectionId: null },
    create: { id: PANEL_ID, imageUrl: null, linkedProductId: null, linkedSectionId: null },
  });

  return NextResponse.json({ ok: true });
}
