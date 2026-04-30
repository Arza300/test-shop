-- CreateTable
CREATE TABLE "CustomStoreSection" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomStoreSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomStoreSectionItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "imageUrl" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "oldPrice" DECIMAL(10,2),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomStoreSectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomStoreSection_isVisible_idx" ON "CustomStoreSection"("isVisible");

-- CreateIndex
CREATE INDEX "CustomStoreSection_position_idx" ON "CustomStoreSection"("position");

-- CreateIndex
CREATE INDEX "CustomStoreSectionItem_sectionId_idx" ON "CustomStoreSectionItem"("sectionId");

-- CreateIndex
CREATE INDEX "CustomStoreSectionItem_isActive_idx" ON "CustomStoreSectionItem"("isActive");

-- CreateIndex
CREATE INDEX "CustomStoreSectionItem_position_idx" ON "CustomStoreSectionItem"("position");

-- AddForeignKey
ALTER TABLE "CustomStoreSectionItem" ADD CONSTRAINT "CustomStoreSectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CustomStoreSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
