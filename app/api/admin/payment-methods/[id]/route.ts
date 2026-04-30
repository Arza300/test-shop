export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { paymentMethodPatchSchema } from "@/lib/validations/payment-method";

type RouteCtx = { params: { id: string } };

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

export async function PATCH(req: Request, ctx: RouteCtx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = paymentMethodPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  try {
    await prisma.paymentMethod.update({
      where: { id: ctx.params.id },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber.trim() } : {}),
        ...(data.transferProofInstruction !== undefined
          ? { transferProofInstruction: data.transferProofInstruction.trim() }
          : {}),
        ...(data.supportNumber !== undefined ? { supportNumber: data.supportNumber ?? null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json({ error: "لا يمكن التعديل الآن لأن migration لم يتم تطبيقه بعد." }, { status: 503 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }
    throw e;
  }
}

export async function DELETE(_: Request, ctx: RouteCtx) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await prisma.paymentMethod.delete({ where: { id: ctx.params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json({ error: "لا يمكن الحذف الآن لأن migration لم يتم تطبيقه بعد." }, { status: 503 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return NextResponse.json(
        { error: "لا يمكن حذف طريقة الدفع لأنها مستخدمة في طلبات موجودة." },
        { status: 409 }
      );
    }
    throw e;
  }
}
