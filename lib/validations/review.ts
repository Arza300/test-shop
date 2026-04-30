import { z } from "zod";

export const reviewSchema = z.object({
  productId: z.string().cuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().or(z.literal("")),
});
