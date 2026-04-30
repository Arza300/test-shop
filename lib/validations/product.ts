import { z } from "zod";
import { ProductFormat, ProductType, Platform } from "@prisma/client";

export const productInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "المسار: أحرف إنجليزية صغيرة وأرقام وشرطات فقط"),
  description: z.string().min(1).max(20000),
  price: z.coerce.number().positive().max(1_000_000),
  type: z.nativeEnum(ProductType),
  format: z.nativeEnum(ProductFormat),
  platform: z.nativeEnum(Platform),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  isActive: z.coerce.boolean().default(true),
  categoryId: z.string().cuid(),
  imageUrls: z.array(z.string().url().or(z.string().startsWith("/"))).max(8).default([]),
  brandId: z.string().cuid().optional(),
  exclusiveToBrandOnly: z.coerce.boolean().optional(),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const productListQuerySchema = z.object({
  q: z.string().max(200).optional(),
  min: z.coerce.number().min(0).optional(),
  max: z.coerce.number().min(0).optional(),
  type: z.nativeEnum(ProductType).optional(),
  platform: z.nativeEnum(Platform).optional(),
  brand: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
});
