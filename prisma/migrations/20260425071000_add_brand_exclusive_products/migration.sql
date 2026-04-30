-- AlterTable
ALTER TABLE "Product" ADD COLUMN "exclusiveBrandId" TEXT;

-- CreateIndex
CREATE INDEX "Product_exclusiveBrandId_idx" ON "Product"("exclusiveBrandId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_exclusiveBrandId_fkey" FOREIGN KEY ("exclusiveBrandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
