export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveImageUrlForClient } from "@/lib/image-url";

export async function GET() {
  const rows = await prisma.homeHeroSlide.findMany({
    orderBy: { position: "asc" },
    select: {
      id: true,
      imageUrl: true,
      position: true,
      headline: true,
      subline: true,
      linkedProductId: true,
    },
  });
  const items = rows.map((row) => ({
    ...row,
    imageUrl: resolveImageUrlForClient(row.imageUrl) ?? row.imageUrl,
  }));
  return NextResponse.json({ items });
}
