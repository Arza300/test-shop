-- CreateTable
CREATE TABLE "PsStoreCard" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsStoreCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PsStoreCard_isActive_idx" ON "PsStoreCard"("isActive");

-- CreateIndex
CREATE INDEX "PsStoreCard_position_idx" ON "PsStoreCard"("position");
