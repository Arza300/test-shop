export const dynamic = "force-dynamic";

import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, { message: "الاسم مطلوب (حرفان على الأقل)" }).max(120).optional(),
    password: z
      .string()
      .min(8, { message: "كلمة المرور 8 أحرف على الأقل" })
      .max(100, { message: "كلمة المرور طويلة جداً" })
      .optional(),
  })
  .refine((data) => data.name !== undefined || data.password !== undefined, {
    message: "لا يوجد شيء للتحديث",
  });

export async function PATCH(req: Request) {
  const { session, error } = await requireSession();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "بيانات غير صالحة" }, { status: 400 });
  }

  const data: { name?: string; passwordHash?: string } = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.password !== undefined) data.passwordHash = await hash(parsed.data.password, 12);

  const user = await prisma.user.update({
    where: { id: session!.user.id },
    data,
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({ user });
}
