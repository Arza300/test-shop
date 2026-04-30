import { z } from "zod";

export const homeSectionsPatchSchema = z
  .object({
    moveSectionKey: z.string().min(1).max(200),
    move: z.enum(["up", "down"]),
  })
  .strict();

export type HomeSectionsPatchInput = z.infer<typeof homeSectionsPatchSchema>;
