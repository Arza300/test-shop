export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { paymentMethodCreateSchema } from "@/lib/validations/payment-method";

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const items = await prisma.paymentMethod.findMany({
      orderBy: [{ createdAt: "desc" }],
      take: 200,
    });
    return NextResponse.json({ items });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json({
        items: [],
        needsMigration: true,
        message: "جدول طرق الدفع غير موجود بعد. شغّل Prisma migration لتفعيل القسم.",
      });
    }
    throw e;
  }
}

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = paymentMethodCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const data = parsed.data;
    const created = await prisma.paymentMethod.create({
      data: {
        name: data.name.trim(),
        phoneNumber: data.phoneNumber.trim(),
        transferProofInstruction: data.transferProofInstruction.trim(),
        supportNumber: data.supportNumber ?? null,
        isActive: data.isActive,
      },
    });
    return NextResponse.json({ id: created.id });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json(
        { error: "لا يمكن إضافة طريقة الدفع الآن لأن migration قاعدة البيانات لم يتم تطبيقه بعد." },
        { status: 503 }
      );
    }
    throw e;
  }
}
