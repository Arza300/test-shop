-- AlterTable
ALTER TABLE "Brand" ADD COLUMN "linkedSectionId" TEXT;

-- CreateIndex
CREATE INDEX "Brand_linkedSectionId_idx" ON "Brand"("linkedSectionId");

-- AddForeignKey
ALTER TABLE "Brand" ADD CONSTRAINT "Brand_linkedSectionId_fkey" FOREIGN KEY ("linkedSectionId") REFERENCES "CustomStoreSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
