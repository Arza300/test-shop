import { prisma } from "@/lib/prisma";

/** Ensures `linkedSectionId` references an existing custom store section when set. */
export async function assertValidBrandLinkedSectionId(
  linkedSectionId: string | null | undefined
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (linkedSectionId == null) return { ok: true };
  const row = await prisma.customStoreSection.findUnique({
    where: { id: linkedSectionId },
    select: { id: true },
  });
  if (!row) return { ok: false, message: "القسم المرتبط غير موجود" };
  return { ok: true };
}
