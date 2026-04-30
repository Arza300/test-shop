export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getObjectBytes, isR2Configured } from "@/lib/r2";

export async function GET(req: NextRequest) {
  if (!isR2Configured()) {
    return NextResponse.json({ error: "R2 not configured" }, { status: 503 });
  }
  const key = req.nextUrl.searchParams.get("key") ?? "";
  if (!key || key.includes("..")) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }
  try {
    const obj = await getObjectBytes(key);
    return new NextResponse(Buffer.from(obj.bytes), {
      headers: {
        "Content-Type": obj.contentType,
        "Cache-Control": obj.cacheControl,
        ...(obj.etag ? { ETag: obj.etag } : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: "Object not found" }, { status: 404 });
  }
}
