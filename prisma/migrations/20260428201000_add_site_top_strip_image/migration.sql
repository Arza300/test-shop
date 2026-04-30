-- Add configurable top strip image for storefront header
ALTER TABLE "SiteBrandingSetting"
ADD COLUMN "topStripImageUrl" TEXT;
