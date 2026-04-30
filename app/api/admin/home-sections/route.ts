export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import {
  buildOrderedHomeSectionKeys,
  getHomeSectionLabel,
  type HomeSectionKey,
} from "@/lib/home-sections";
import { homeSectionsPatchSchema } from "@/lib/validations/home-sections";

function isMissingTableError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

type CustomSectionOrderRow = {
  id: string;
  title: string;
};

type HomeSectionOrderSnapshot = {
  orderedKeys: HomeSectionKey[];
  customTitleById: Record<string, string>;
};

async function readHomeSectionOrderSnapshot(): Promise<HomeSectionOrderSnapshot> {
  let storedKeys: string[] = [];
  try {
    const orderRows = await prisma.homepageSectionOrder.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { sectionKey: true },
      take: 500,
    });
    storedKeys = orderRows.map((row) => row.sectionKey);
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  let customRows: CustomSectionOrderRow[] = [];
  try {
    customRows = await prisma.customStoreSection.findMany({
      where: { isVisible: true },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { id: true, title: true },
      take: 500,
    });
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  const customTitleById = Object.fromEntries(customRows.map((row) => [row.id, row.title])) as Record<string, string>;
  const orderedKeys = buildOrderedHomeSectionKeys({
    storedKeys,
    customSectionIds: customRows.map((row) => row.id),
  });
  return { orderedKeys, customTitleById };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const snapshot = await readHomeSectionOrderSnapshot();
  return NextResponse.json({
    items: snapshot.orderedKeys.map((sectionKey, position) => ({
      sectionKey,
      title: getHomeSectionLabel({ sectionKey, customTitleById: snapshot.customTitleById }),
      position,
    })),
  });
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = homeSectionsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات غير صالحة", details: parsed.error.flatten() }, { status: 400 });
  }

  const snapshot = await readHomeSectionOrderSnapshot();
  const orderedKeys = [...snapshot.orderedKeys];
  const index = orderedKeys.findIndex((key) => key === parsed.data.moveSectionKey);
  if (index < 0) {
    return NextResponse.json({ error: "القسم غير موجود" }, { status: 404 });
  }

  const swapWith = parsed.data.move === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= orderedKeys.length) {
    return NextResponse.json({ ok: true });
  }

  [orderedKeys[index], orderedKeys[swapWith]] = [orderedKeys[swapWith]!, orderedKeys[index]!];

  try {
    await prisma.$transaction(
      orderedKeys.map((sectionKey, position) =>
        prisma.homepageSectionOrder.upsert({
          where: { sectionKey },
          create: { sectionKey, position },
          update: { position },
        })
      )
    );
  } catch (txError) {
    if (isMissingTableError(txError)) {
      return NextResponse.json({ error: "يرجى تشغيل migration الخاصة بترتيب أقسام الهوم أولاً." }, { status: 503 });
    }
    throw txError;
  }

  return NextResponse.json({ ok: true });
}
