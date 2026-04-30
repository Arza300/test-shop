export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { customStoreSectionPatchSchema } from "@/lib/validations/custom-store-section";

type RouteCtx = { params: { id: string } };

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

function isMissingShowTitleColumnError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022" &&
    typeof error.meta?.column === "string" &&
    error.meta.column.includes("showTitle")
  );
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = customStoreSectionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const payload = parsed.data;

    if (payload.move === "up" || payload.move === "down") {
      const ordered = await prisma.customStoreSection.findMany({
        orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      });
      const idx = ordered.findIndex((section) => section.id === id);
      if (idx === -1) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

      const swapWith = payload.move === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= ordered.length) return NextResponse.json({ ok: true });

      const a = ordered[idx]!;
      const b = ordered[swapWith]!;
      await prisma.$transaction([
        prisma.customStoreSection.update({ where: { id: a.id }, data: { position: b.position } }),
        prisma.customStoreSection.update({ where: { id: b.id }, data: { position: a.position } }),
      ]);
      return NextResponse.json({ ok: true });
    }

    const data: Record<string, unknown> = {};
    if (typeof payload.title === "string") data.title = payload.title.trim();
    if (payload.logoUrl !== undefined) data.logoUrl = payload.logoUrl ?? null;
    if (payload.logoTitle !== undefined) data.logoTitle = payload.logoTitle ?? null;
    if (payload.logoDescription !== undefined) data.logoDescription = payload.logoDescription ?? null;
    if (payload.backgroundColor !== undefined) data.backgroundColor = payload.backgroundColor ?? null;
    if (payload.cardBackgroundColor !== undefined) data.cardBackgroundColor = payload.cardBackgroundColor ?? null;
    if (typeof payload.showTitle === "boolean") data.showTitle = payload.showTitle;
    if (typeof payload.isVisible === "boolean") data.isVisible = payload.isVisible;
    if (typeof payload.position === "number") data.position = payload.position;
    if (!Object.keys(data).length) {
      return NextResponse.json({ error: "لا يوجد شيء للتحديث" }, { status: 400 });
    }

    try {
      await prisma.customStoreSection.update({
        where: { id },
        data: data as Prisma.CustomStoreSectionUncheckedUpdateInput,
      });
    } catch (error) {
      if (!isMissingShowTitleColumnError(error)) throw error;
      const { showTitle: _ignored, ...fallbackData } = data;
      await prisma.customStoreSection.update({
        where: { id },
        data: fallbackData as Prisma.CustomStoreSectionUncheckedUpdateInput,
      });
    }

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

export async function DELETE(_: NextRequest, ctx: RouteCtx) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await prisma.customStoreSection.delete({ where: { id: ctx.params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json({ error: "لا يمكن الحذف الآن لأن migration لم يتم تطبيقه بعد." }, { status: 503 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ error: "غير موجود" }, { status: 404 });
    }
    throw e;
  }
}
