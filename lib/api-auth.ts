import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "غير مصرّح" }, { status: 401 }) };
  }
  return { session, error: null as null };
}

export async function requireAdmin() {
  const s = await requireSession();
  if (s.error) return s;
  if (s.session!.user.role !== Role.ADMIN) {
    return { session: s.session, error: NextResponse.json({ error: "ممنوع" }, { status: 403 }) };
  }
  return { session: s.session, error: null as null };
}
