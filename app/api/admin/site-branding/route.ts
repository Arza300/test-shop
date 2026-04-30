export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

const BRAND_ID = "main";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const row = await prisma.siteBrandingSetting.findUnique({ where: { id: BRAND_ID } });
  return NextResponse.json({
    name: row?.name ?? null,
    logoUrl: row?.logoUrl ?? null,
    topStripImageUrl: row?.topStripImageUrl ?? null,
  });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "جسم الطلب غير صالح" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "جسم الطلب غير صالح" }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;

  const hasName = Object.prototype.hasOwnProperty.call(payload, "name");
  const hasLogoUrl = Object.prototype.hasOwnProperty.call(payload, "logoUrl");
  const hasTopStripImageUrl = Object.prototype.hasOwnProperty.call(payload, "topStripImageUrl");

  const updateData: { name?: string | null; logoUrl?: string | null; topStripImageUrl?: string | null } = {};
  const createData: { id: string; name?: string | null; logoUrl?: string | null; topStripImageUrl?: string | null } = {
    id: BRAND_ID,
  };

  if (hasName) {
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    updateData.name = name || null;
    createData.name = name || null;
  }
  if (hasLogoUrl) {
    const logoUrl = typeof payload.logoUrl === "string" ? payload.logoUrl.trim() : "";
    updateData.logoUrl = logoUrl || null;
    createData.logoUrl = logoUrl || null;
  }
  if (hasTopStripImageUrl) {
    const topStripImageUrl = typeof payload.topStripImageUrl === "string" ? payload.topStripImageUrl.trim() : "";
    updateData.topStripImageUrl = topStripImageUrl || null;
    createData.topStripImageUrl = topStripImageUrl || null;
  }

  if (!hasName && !hasLogoUrl && !hasTopStripImageUrl) {
    return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
  }

  const row = await prisma.siteBrandingSetting.upsert({
    where: { id: BRAND_ID },
    update: updateData,
    create: createData,
  });

  return NextResponse.json({
    name: row.name ?? null,
    logoUrl: row.logoUrl ?? null,
    topStripImageUrl: row.topStripImageUrl ?? null,
  });
}
