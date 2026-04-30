export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { resolveImageUrlForClient } from "@/lib/image-url";

const PANEL_ID = "main";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const row = await prisma.homeHeroSidePanel.findUnique({ where: { id: PANEL_ID } });
  return NextResponse.json({
    imageUrl: row?.imageUrl ? resolveImageUrlForClient(row.imageUrl) ?? row.imageUrl : null,
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

  const imageUrl = (body as { imageUrl?: unknown })?.imageUrl;
  if (typeof imageUrl !== "string" || !imageUrl.trim()) {
    return NextResponse.json({ error: "???? ?????? ?????" }, { status: 400 });
  }

  const row = await prisma.homeHeroSidePanel.upsert({
    where: { id: PANEL_ID },
    update: { imageUrl: imageUrl.trim() },
    create: { id: PANEL_ID, imageUrl: imageUrl.trim() },
  });

  return NextResponse.json({
    imageUrl: resolveImageUrlForClient(row.imageUrl) ?? row.imageUrl,
  });
}

export async function DELETE() {
  const { error } = await requireAdmin();
  if (error) return error;

  await prisma.homeHeroSidePanel.upsert({
    where: { id: PANEL_ID },
    update: { imageUrl: null },
    create: { id: PANEL_ID, imageUrl: null },
  });

  return NextResponse.json({ ok: true });
}
