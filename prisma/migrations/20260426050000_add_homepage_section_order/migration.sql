-- CreateTable
CREATE TABLE "HomepageSectionOrder" (
    "id" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSectionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomepageSectionOrder_sectionKey_key" ON "HomepageSectionOrder"("sectionKey");

-- CreateIndex
CREATE INDEX "HomepageSectionOrder_position_idx" ON "HomepageSectionOrder"("position");
