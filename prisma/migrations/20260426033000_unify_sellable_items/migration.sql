-- CreateEnum
CREATE TYPE "SellableItemType" AS ENUM ('PRODUCT', 'PS_CD_GAME', 'PS_STORE_CARD');

-- AlterTable
ALTER TABLE "PsCdGame"
ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "PsStoreCard"
ADD COLUMN "stock" INTEGER NOT NULL DEFAULT 0;

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- AlterTable
ALTER TABLE "OrderItem"
ADD COLUMN "itemId" TEXT,
ADD COLUMN "itemType" "SellableItemType" NOT NULL DEFAULT 'PRODUCT',
ADD COLUMN "titleSnapshot" TEXT,
ALTER COLUMN "productId" DROP NOT NULL;

-- Backfill existing rows
UPDATE "OrderItem"
SET
  "itemId" = "productId",
  "titleSnapshot" = COALESCE("Product"."title", '')
FROM "Product"
WHERE "OrderItem"."productId" = "Product"."id";

-- Required after backfill
ALTER TABLE "OrderItem"
ALTER COLUMN "itemId" SET NOT NULL,
ALTER COLUMN "titleSnapshot" SET NOT NULL;

-- CreateIndex
CREATE INDEX "OrderItem_itemType_itemId_idx" ON "OrderItem"("itemType", "itemId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
