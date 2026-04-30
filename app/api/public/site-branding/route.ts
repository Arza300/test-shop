export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveImageUrlForClient } from "@/lib/image-url";

const BRAND_ID = "main";

export async function GET() {
  const row = await prisma.siteBrandingSetting.findUnique({ where: { id: BRAND_ID } });
  return NextResponse.json({
    name: row?.name ?? null,
    logoUrl: row?.logoUrl ? resolveImageUrlForClient(row.logoUrl) ?? row.logoUrl : null,
    topStripImageUrl: row?.topStripImageUrl
      ? resolveImageUrlForClient(row.topStripImageUrl) ?? row.topStripImageUrl
      : null,
  });
}
