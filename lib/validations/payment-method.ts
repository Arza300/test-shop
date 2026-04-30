import { z } from "zod";

const optionalTrimmed = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}, z.string().max(100).nullable().optional());

export const paymentMethodCreateSchema = z.object({
  name: z.string().min(2, { message: "اسم طريقة الدفع مطلوب" }).max(120),
  phoneNumber: z.string().min(5, { message: "رقم الهاتف مطلوب" }).max(30),
  transferProofInstruction: z.string().min(5, { message: "تعليمات إثبات التحويل مطلوبة" }).max(2000),
  supportNumber: optionalTrimmed,
  isActive: z.coerce.boolean().default(true),
});

export const paymentMethodPatchSchema = paymentMethodCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "يجب إرسال حقل واحد على الأقل للتحديث",
  });
