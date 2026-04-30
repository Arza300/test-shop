-- CreateEnum
CREATE TYPE "PsCdGamePlatform" AS ENUM ('PS4', 'PS5');

-- CreateTable
CREATE TABLE "PsCdGame" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "platform" "PsCdGamePlatform" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "originalPrice" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsCdGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PsCdGame_isActive_idx" ON "PsCdGame"("isActive");

-- CreateIndex
CREATE INDEX "PsCdGame_position_idx" ON "PsCdGame"("position");
