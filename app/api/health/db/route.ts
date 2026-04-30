import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Verifies DATABASE_URL and that Prisma can query Neon.
 * In production, consider auth, rate limits, or removing this route.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const [userCount, productCount, categoryCount, orderCount] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.count(),
    ]);

    return NextResponse.json({
      ok: true,
      database: "connected",
      provider: "postgresql",
      counts: { userCount, productCount, categoryCount, orderCount },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: "Database connection or query failed",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 503 }
    );
  }
}
