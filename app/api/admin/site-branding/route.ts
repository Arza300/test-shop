export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { parseBrandPrimaryHex } from "@/lib/brand-primary-theme";
import { isSafeHttpUrlString } from "@/lib/external-url";

const BRAND_ID = "main";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const row = await prisma.siteBrandingSetting.findUnique({ where: { id: BRAND_ID } });
  return NextResponse.json({
    name: row?.name ?? null,
    logoUrl: row?.logoUrl ?? null,
    topStripImageUrl: row?.topStripImageUrl ?? null,
    facebookUrl: row?.facebookUrl ?? null,
    whatsappUrl: row?.whatsappUrl ?? null,
    supportPhone: row?.supportPhone ?? null,
    bb8WelcomeText: row?.bb8WelcomeText ?? null,
    brandPrimaryHex: row?.brandPrimaryHex ?? null,
  });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "جسم الطلب غير صالح" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "جسم الطلب غير صالح" }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;

  const hasName = Object.prototype.hasOwnProperty.call(payload, "name");
  const hasLogoUrl = Object.prototype.hasOwnProperty.call(payload, "logoUrl");
  const hasTopStripImageUrl = Object.prototype.hasOwnProperty.call(payload, "topStripImageUrl");
  const hasFacebookUrl = Object.prototype.hasOwnProperty.call(payload, "facebookUrl");
  const hasWhatsappUrl = Object.prototype.hasOwnProperty.call(payload, "whatsappUrl");
  const hasSupportPhone = Object.prototype.hasOwnProperty.call(payload, "supportPhone");
  const hasBb8WelcomeText = Object.prototype.hasOwnProperty.call(payload, "bb8WelcomeText");
  const hasBrandPrimaryHex = Object.prototype.hasOwnProperty.call(payload, "brandPrimaryHex");

  const updateData: {
    name?: string | null;
    logoUrl?: string | null;
    topStripImageUrl?: string | null;
    facebookUrl?: string | null;
    whatsappUrl?: string | null;
    supportPhone?: string | null;
    bb8WelcomeText?: string | null;
    brandPrimaryHex?: string | null;
  } = {};
  const createData: {
    id: string;
    name?: string | null;
    logoUrl?: string | null;
    topStripImageUrl?: string | null;
    facebookUrl?: string | null;
    whatsappUrl?: string | null;
    supportPhone?: string | null;
    bb8WelcomeText?: string | null;
    brandPrimaryHex?: string | null;
  } = {
    id: BRAND_ID,
  };

  if (hasName) {
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    updateData.name = name || null;
    createData.name = name || null;
  }
  if (hasLogoUrl) {
    const logoUrl = typeof payload.logoUrl === "string" ? payload.logoUrl.trim() : "";
    updateData.logoUrl = logoUrl || null;
    createData.logoUrl = logoUrl || null;
  }
  if (hasTopStripImageUrl) {
    const topStripImageUrl = typeof payload.topStripImageUrl === "string" ? payload.topStripImageUrl.trim() : "";
    updateData.topStripImageUrl = topStripImageUrl || null;
    createData.topStripImageUrl = topStripImageUrl || null;
  }
  if (hasFacebookUrl) {
    const facebookUrl = typeof payload.facebookUrl === "string" ? payload.facebookUrl.trim() : "";
    if (facebookUrl && !isSafeHttpUrlString(facebookUrl)) {
      return NextResponse.json({ error: "رابط فيسبوك يجب أن يبدأ بـ https:// أو http://" }, { status: 400 });
    }
    updateData.facebookUrl = facebookUrl || null;
    createData.facebookUrl = facebookUrl || null;
  }
  if (hasWhatsappUrl) {
    const whatsappUrl = typeof payload.whatsappUrl === "string" ? payload.whatsappUrl.trim() : "";
    if (whatsappUrl && !isSafeHttpUrlString(whatsappUrl)) {
      return NextResponse.json({ error: "رابط واتساب يجب أن يبدأ بـ https:// أو http://" }, { status: 400 });
    }
    updateData.whatsappUrl = whatsappUrl || null;
    createData.whatsappUrl = whatsappUrl || null;
  }
  if (hasSupportPhone) {
    const supportPhone = typeof payload.supportPhone === "string" ? payload.supportPhone.trim() : "";
    updateData.supportPhone = supportPhone || null;
    createData.supportPhone = supportPhone || null;
  }
  if (hasBb8WelcomeText) {
    const bb8WelcomeText = typeof payload.bb8WelcomeText === "string" ? payload.bb8WelcomeText.trim() : "";
    updateData.bb8WelcomeText = bb8WelcomeText || null;
    createData.bb8WelcomeText = bb8WelcomeText || null;
  }
  if (hasBrandPrimaryHex) {
    const raw = typeof payload.brandPrimaryHex === "string" ? payload.brandPrimaryHex.trim() : "";
    if (!raw) {
      updateData.brandPrimaryHex = null;
      createData.brandPrimaryHex = null;
    } else {
      const hex = parseBrandPrimaryHex(raw);
      if (!hex) {
        return NextResponse.json(
          { error: "لون التمييز غير صالح — استخدم #RRGGBB أو RRGGBB (مثل #9333ea)" },
          { status: 400 }
        );
      }
      updateData.brandPrimaryHex = hex;
      createData.brandPrimaryHex = hex;
    }
  }

  if (
    !hasName &&
    !hasLogoUrl &&
    !hasTopStripImageUrl &&
    !hasFacebookUrl &&
    !hasWhatsappUrl &&
    !hasSupportPhone &&
    !hasBb8WelcomeText &&
    !hasBrandPrimaryHex
  ) {
    return NextResponse.json({ error: "لا توجد بيانات للتحديث" }, { status: 400 });
  }

  try {
    const row = await prisma.siteBrandingSetting.upsert({
      where: { id: BRAND_ID },
      update: updateData,
      create: createData,
    });

    return NextResponse.json({
      name: row.name ?? null,
      logoUrl: row.logoUrl ?? null,
      topStripImageUrl: row.topStripImageUrl ?? null,
      facebookUrl: row.facebookUrl ?? null,
      whatsappUrl: row.whatsappUrl ?? null,
      supportPhone: row.supportPhone ?? null,
      bb8WelcomeText: row.bb8WelcomeText ?? null,
      brandPrimaryHex: row.brandPrimaryHex ?? null,
    });
  } catch (e) {
    console.error("[site-branding PUT]", e);
    if (e instanceof Prisma.PrismaClientValidationError) {
      return NextResponse.json(
        {
          error:
            "عميل Prisma قديم أو غير متزامن مع المخطط. أوقف الخادم ثم نفّذ: npx prisma generate ثم أعد التشغيل (أو استخدم npm run dev الذي يولّد العميل تلقائياً).",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "تعذّر حفظ إعدادات العلامة. تحقق من سجل الخادم أو اتصال قاعدة البيانات." },
      { status: 500 }
    );
  }
}
