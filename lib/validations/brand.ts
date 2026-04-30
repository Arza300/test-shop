import { z } from "zod";

const slugSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "المسار: أحرف إنجليزية صغيرة وأرقام وشرطات فقط");

export const brandCreateSchema = z.object({
  name: z.string().min(1).max(200),
  slug: slugSchema,
  logoUrl: z.string().min(1).max(4000),
  isVisible: z.coerce.boolean().default(true),
  position: z.coerce.number().int().min(0).max(1_000_000).optional(),
});

export type BrandCreateInput = z.infer<typeof brandCreateSchema>;

export const brandPatchSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    slug: slugSchema.optional(),
    logoUrl: z.string().min(1).max(4000).optional(),
    isVisible: z.boolean().optional(),
    position: z.coerce.number().int().min(0).max(1_000_000).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "لا توجد حقول للتحديث" });

export type BrandPatchInput = z.infer<typeof brandPatchSchema>;
