import { z } from "zod";

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "لون غير صالح. استخدم تنسيق HEX مثل #08379B");

export const customStoreSectionInputSchema = z.object({
  title: z.string().min(1).max(200),
  logoUrl: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.union([z.string().url(), z.string().startsWith("/"), z.null()]).optional()
  ),
  logoTitle: z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }, z.string().max(200).nullable().optional()),
  logoDescription: z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }, z.string().max(1000).nullable().optional()),
  backgroundColor: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.union([hexColorSchema, z.null()]).optional()
  ),
  cardBackgroundColor: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.union([hexColorSchema, z.null()]).optional()
  ),
  showTitle: z.coerce.boolean().default(true),
  isVisible: z.coerce.boolean().default(true),
  position: z.coerce.number().int().min(0).max(10000).optional(),
});

export const customStoreSectionPatchSchema = customStoreSectionInputSchema
  .partial()
  .extend({
    move: z.enum(["up", "down"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "يجب إرسال حقل واحد على الأقل للتحديث",
  });

const customStoreSectionItemBaseSchema = z.object({
  title: z.string().min(1).max(500),
  subtitle: z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }, z.string().max(3000).nullable().optional()),
  imageUrl: z.string().url().or(z.string().startsWith("/")),
  price: z.coerce.number().positive().max(1_000_000),
  oldPrice: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z.union([z.coerce.number().positive().max(1_000_000), z.null()]).optional()
  ),
  hasVariants: z.coerce.boolean().default(false),
  variants: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(120),
        price: z.coerce.number().positive().max(1_000_000),
      })
    )
    .max(50)
    .optional()
    .default([]),
  stock: z.coerce.number().int().min(0).max(1_000_000).default(0),
  isActive: z.coerce.boolean().default(true),
  position: z.coerce.number().int().min(0).max(10000).optional(),
});

export const customStoreSectionItemInputSchema = customStoreSectionItemBaseSchema.superRefine((value, ctx) => {
  if (!value.hasVariants) return;
  if (!value.variants.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["variants"],
      message: "أضف نوعاً واحداً على الأقل عند تفعيل الأسعار المختلفة",
    });
  }
});

export const customStoreSectionItemPatchSchema = customStoreSectionItemBaseSchema
  .partial()
  .extend({
    move: z.enum(["up", "down"]).optional(),
  })
  .superRefine((value, ctx) => {
    const hasVariants = value.hasVariants ?? (Array.isArray(value.variants) ? value.variants.length > 0 : false);
    if (!hasVariants) return;
    if (!Array.isArray(value.variants) || !value.variants.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["variants"],
        message: "أضف نوعاً واحداً على الأقل عند تفعيل الأسعار المختلفة",
      });
    }
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "يجب إرسال حقل واحد على الأقل للتحديث",
  });

export type CustomStoreSectionInput = z.infer<typeof customStoreSectionInputSchema>;
export type CustomStoreSectionItemInput = z.infer<typeof customStoreSectionItemInputSchema>;
