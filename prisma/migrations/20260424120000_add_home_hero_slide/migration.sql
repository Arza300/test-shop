-- CreateTable
CREATE TABLE "HomeHeroSlide" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "headline" TEXT,
    "subline" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeHeroSlide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomeHeroSlide_position_idx" ON "HomeHeroSlide"("position");
