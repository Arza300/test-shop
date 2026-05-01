export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { brandPatchSchema } from "@/lib/validations/brand";
import { assertValidBrandLinkedSectionId } from "@/lib/brand-linked-section";
import { resolveImageUrlForClient } from "@/lib/image-url";

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const row = await prisma.brand.findUnique({
      where: { id: params.id },
      include: { linkedSection: { select: { id: true, title: true } } },
    });
    if (!row) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

    return NextResponse.json({
      id: row.id,
      name: row.name,
      slug: row.slug,
      logoUrl: resolveImageUrlForClient(row.logoUrl) ?? row.logoUrl,
      isVisible: row.isVisible,
      position: row.position,
      linkedSectionId: row.linkedSectionId,
      linkedSectionTitle: row.linkedSection?.title ?? null,
    });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json({ error: "جدول العلامات غير موجود بعد. شغّل migration أولاً." }, { status: 503 });
    }
    throw e;
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = brandPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const sectionCheck = await assertValidBrandLinkedSectionId(
    data.linkedSectionId === undefined ? undefined : data.linkedSectionId
  );
  if (!sectionCheck.ok) {
    return NextResponse.json({ error: sectionCheck.message }, { status: 400 });
  }

  try {
    const existing = await prisma.brand.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      const rest = data;
      const updateData: Prisma.BrandUpdateInput = {};
      if (rest.name !== undefined) updateData.name = rest.name.trim();
      if (rest.slug !== undefined) updateData.slug = rest.slug.trim();
      if (rest.logoUrl !== undefined) updateData.logoUrl = rest.logoUrl.trim();
      if (rest.isVisible !== undefined) updateData.isVisible = rest.isVisible;
      if (rest.position !== undefined) updateData.position = rest.position;
      if (rest.linkedSectionId !== undefined) {
        updateData.linkedSection =
          rest.linkedSectionId === null
            ? { disconnect: true }
            : { connect: { id: rest.linkedSectionId } };
      }

      if (Object.keys(updateData).length > 0) {
        await tx.brand.update({
          where: { id: params.id },
          data: updateData,
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isMissingTableError(e)) {
      return NextResponse.json({ error: "لا يمكن التعديل الآن لأن migration لم يتم تطبيقه بعد." }, { status: 503 });
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "المسار (slug) مستخدم بالفعل" }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    await prisma.brand.delete({ where: { id: params.id } });
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
