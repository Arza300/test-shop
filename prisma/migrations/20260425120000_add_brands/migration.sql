-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandProduct" (
    "brandId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "BrandProduct_pkey" PRIMARY KEY ("brandId","productId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- CreateIndex
CREATE INDEX "Brand_isVisible_idx" ON "Brand"("isVisible");

-- CreateIndex
CREATE INDEX "Brand_position_idx" ON "Brand"("position");

-- CreateIndex
CREATE INDEX "BrandProduct_productId_idx" ON "BrandProduct"("productId");

-- AddForeignKey
ALTER TABLE "BrandProduct" ADD CONSTRAINT "BrandProduct_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandProduct" ADD CONSTRAINT "BrandProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
