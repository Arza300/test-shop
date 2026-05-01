export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveImageUrlForClient } from "@/lib/image-url";

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

export async function GET() {
  try {
    const items = await prisma.brand.findMany({
      where: { isVisible: true },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      take: 48,
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        linkedSectionId: true,
      },
    });
    return NextResponse.json({
      items: items.map((b) => ({
        ...b,
        logoUrl: resolveImageUrlForClient(b.logoUrl) ?? b.logoUrl,
      })),
    });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json({ items: [] });
    }
    throw e;
  }
}
