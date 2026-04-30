import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Verifies DATABASE_URL and that Prisma can query Neon.
 * In production, consider auth, rate limits, or removing this route.
 */
export const dynamic = "force-dynamic";

function envPresence() {
  return {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DIRECT_URL: Boolean(process.env.DIRECT_URL),
    NEXTAUTH_URL: Boolean(process.env.NEXTAUTH_URL),
    NEXTAUTH_OR_AUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET),
  };
}

function hintsFromEnv(e: ReturnType<typeof envPresence>): string[] {
  const hints: string[] = [];
  if (!e.DATABASE_URL) hints.push("DATABASE_URL is not set on this deployment");
  if (!e.DIRECT_URL) hints.push("DIRECT_URL is not set — required by prisma/schema datasource");
  if (!e.NEXTAUTH_OR_AUTH_SECRET) hints.push("Set NEXTAUTH_SECRET or AUTH_SECRET for NextAuth in production");
  if (!e.NEXTAUTH_URL) hints.push("Set NEXTAUTH_URL to your canonical public URL (HTTPS)");
  return hints;
}

export async function GET() {
  const env = envPresence();
  const hints = hintsFromEnv(env);

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
      /** Booleans only — no secret values exposed */
      env: env,
      troubleshooting: hints.length ? hints : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: "Database connection or query failed",
        env: env,
        hints:
          hints.length > 0
            ? [...hints]
            : [
                "If env flags look OK, check Neon allowlists, SSL mode, or copy the Digest into Vercel Runtime Logs.",
              ],
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 503 }
    );
  }
}
