-- Map legacy PlayStation order items to PRODUCT before enum shrink.
UPDATE "OrderItem"
SET "itemType" = 'PRODUCT'
WHERE "itemType" IN ('PS_CD_GAME', 'PS_STORE_CARD');

-- Recreate enum without legacy PlayStation variants.
CREATE TYPE "SellableItemType_new" AS ENUM ('PRODUCT', 'CUSTOM_SECTION_ITEM');
ALTER TABLE "OrderItem"
ALTER COLUMN "itemType" TYPE "SellableItemType_new"
USING ("itemType"::text::"SellableItemType_new");
DROP TYPE "SellableItemType";
ALTER TYPE "SellableItemType_new" RENAME TO "SellableItemType";

-- Drop legacy PlayStation tables/types.
DROP TABLE IF EXISTS "PsCdGame";
DROP TYPE IF EXISTS "PsCdGamePlatform";
DROP TABLE IF EXISTS "PsStoreCard";
