import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveImageUrlForClient } from "@/lib/image-url";

const BRAND_ID = "main";

export type PublicSiteBranding = {
  brandPrimaryHex: string | null;
  name: string | null;
  logoUrl: string | null;
};

export async function getPublicSiteBranding(): Promise<PublicSiteBranding> {
  try {
    const row = await prisma.siteBrandingSetting.findUnique({
      where: { id: BRAND_ID },
      select: { brandPrimaryHex: true, name: true, logoUrl: true },
    });
    const brandPrimaryHex = row?.brandPrimaryHex?.trim() || null;
    const name = row?.name?.trim() || null;
    const logoUrl = row?.logoUrl
      ? resolveImageUrlForClient(row.logoUrl) ?? row.logoUrl
      : null;
    return { brandPrimaryHex, name, logoUrl };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return { brandPrimaryHex: null, name: null, logoUrl: null };
    }
    throw error;
  }
}

export async function getStoredBrandPrimaryHex(): Promise<string | null> {
  const b = await getPublicSiteBranding();
  return b.brandPrimaryHex;
}
