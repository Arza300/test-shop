export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

export async function GET() {
  try {
    const items = await prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: [{ createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        transferProofInstruction: true,
        supportNumber: true,
        isActive: true,
      },
    });
    return NextResponse.json({ items });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json({ items: [] });
    }
    throw e;
  }
}
