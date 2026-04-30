export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getVisibleCustomStoreSectionNavItems } from "@/lib/custom-store-sections-public";

export async function GET() {
  const items = await getVisibleCustomStoreSectionNavItems();
  return NextResponse.json({ items });
}
