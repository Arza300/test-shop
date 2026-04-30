-- Add optional linked product for hero slides
ALTER TABLE "HomeHeroSlide"
ADD COLUMN "linkedProductId" TEXT;

CREATE INDEX "HomeHeroSlide_linkedProductId_idx" ON "HomeHeroSlide"("linkedProductId");
