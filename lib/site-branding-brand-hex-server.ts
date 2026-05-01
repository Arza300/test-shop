import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const BRAND_ID = "main";

export async function getStoredBrandPrimaryHex(): Promise<string | null> {
  try {
    const row = await prisma.siteBrandingSetting.findUnique({
      where: { id: BRAND_ID },
      select: { brandPrimaryHex: true },
    });
    const v = row?.brandPrimaryHex?.trim();
    return v || null;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return null;
    }
    throw error;
  }
}
