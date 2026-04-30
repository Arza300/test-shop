export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/api-auth";
import { isR2Configured, getPresignedPutUrl, uploadObjectFromBuffer } from "@/lib/r2";
import { saveUploadedImagePublic } from "@/lib/local-image-upload";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "الملف مطلوب" }, { status: 400 });
  }
  if (!isR2Configured()) {
    try {
      const { url } = await saveUploadedImagePublic(file);
      return NextResponse.json({ url, key: null, storage: "local" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "فشل حفظ الملف محلياً";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }
  try {
    const ext = (file.name.split(".").pop() || "bin").toLowerCase().slice(0, 5);
    const key = `uploads/${new Date().toISOString().slice(0, 10)}/${randomBytes(8).toString("hex")}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const type = file.type || "application/octet-stream";
    const url = await uploadObjectFromBuffer(key, buf, type);
    return NextResponse.json({ url, key, storage: "r2" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "فشل الرفع إلى التخزين السحابي";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Presigned URL for direct client upload (admin UI).
 * GET /api/upload?key=...&type=image/png
 */
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  if (!isR2Configured()) {
    return NextResponse.json({ error: "لم يُضبط R2" }, { status: 503 });
  }
  const name = req.nextUrl.searchParams.get("name") || "file.bin";
  const contentType = req.nextUrl.searchParams.get("type") || "application/octet-stream";
  const ext = name.split(".").pop() || "bin";
  const key = `uploads/${new Date().toISOString().slice(0, 10)}/${randomBytes(6).toString("hex")}.${ext}`;
  const putUrl = await getPresignedPutUrl(key, contentType, 300);
  const publicBase = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (!publicBase) {
    return NextResponse.json({ error: "مطلوب R2_PUBLIC_BASE_URL للروابط العامة" }, { status: 500 });
  }
  return NextResponse.json({ putUrl, key, publicUrl: `${publicBase}/${key}` });
}
