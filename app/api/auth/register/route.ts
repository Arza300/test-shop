export const dynamic = "force-dynamic";

import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, email, password } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "البريد مسجّل مسبقاً" }, { status: 409 });
  }
  const passwordHash = await hash(password, 12);
  await prisma.user.create({
    data: { name, email: email.toLowerCase(), passwordHash, role: "USER" },
  });
  return NextResponse.json({ ok: true });
}
