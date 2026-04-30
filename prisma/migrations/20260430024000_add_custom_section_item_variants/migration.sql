-- Add optional variant pricing support for custom store section items
ALTER TABLE "CustomStoreSectionItem"
ADD COLUMN "hasVariants" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "variants" JSONB;
