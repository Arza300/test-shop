export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Prisma, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const patchSchema = z
  .object({
    userId: z.string().cuid(),
    role: z.nativeEnum(Role).optional(),
    name: z.string().trim().min(2).max(80).optional(),
    email: z.string().trim().email().max(191).optional(),
    password: z.string().min(8, { message: "كلمة المرور 8 أحرف على الأقل" }).max(100).optional(),
  })
  .refine((data) => data.role !== undefined || data.name !== undefined || data.email !== undefined || data.password !== undefined, {
    message: "لا يوجد شيء للتحديث",
  });

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      take: 500,
    });
    return NextResponse.json({ items: users });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
      return NextResponse.json({
        items: [],
        needsMigration: true,
        message: "جدول المستخدمين غير موجود في قاعدة البيانات الحالية.",
      });
    }
    throw err;
  }
}

export async function PATCH(req: Request) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  void session;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "بيانات غير صالحة" }, { status: 400 });
  }
  const { userId, role, name, email, password } = parsed.data;
  try {
    if (role === Role.USER) {
      const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
      const target = await prisma.user.findUnique({ where: { id: userId } });
      if (target?.role === Role.ADMIN && adminCount <= 1) {
        return NextResponse.json({ error: "لا يمكن إزالة آخر مدير" }, { status: 400 });
      }
    }
    const data: { role?: Role; name?: string; email?: string; passwordHash?: string } = {};
    if (role !== undefined) data.role = role;
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email.toLowerCase();
    if (password !== undefined) data.passwordHash = await hash(password, 12);
    const u = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json(u);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "هذا البريد مستخدم بالفعل" }, { status: 400 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
      return NextResponse.json(
        { error: "جدول المستخدمين غير موجود في قاعدة البيانات الحالية." },
        { status: 503 }
      );
    }
    throw err;
  }
}
