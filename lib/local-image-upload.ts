import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "svg",
  "bmp",
  "ico",
  "heic",
  "heif",
]);

/** Save image upload under public/ for dev / when R2 is not configured. Returns public URL path e.g. /uploads/2026-04-29/abc.jpg */
export async function saveUploadedImagePublic(file: File): Promise<{ url: string }> {
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) throw new Error("الملف فارغ");
  if (buf.length > MAX_BYTES) throw new Error("حجم الصورة كبير جداً");

  const ext = (file.name.split(".").pop() || "bin").toLowerCase().slice(0, 5);
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error("نوع الملف غير مدعوم. استخدم صورة (PNG، JPG، WEBP …)");
  }
  const type = file.type || "";
  if (type && !type.startsWith("image/") && !type.includes("heic") && !type.includes("heif")) {
    throw new Error("مسموح رفع صور فقط.");
  }

  const dateDir = new Date().toISOString().slice(0, 10);
  const fname = `${randomBytes(12).toString("hex")}.${ext}`;
  const relativeDir = path.join("uploads", dateDir);
  const absDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absDir, { recursive: true });
  const absPath = path.join(absDir, fname);
  await writeFile(absPath, buf);

  const urlPath = `/${relativeDir.replace(/\\/g, "/")}/${fname}`;
  return { url: urlPath };
}
