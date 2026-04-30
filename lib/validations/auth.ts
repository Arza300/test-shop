import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "بريد إلكتروني غير صالح" }),
  password: z.string().min(1, { message: "أدخل كلمة المرور" }),
});

export const registerSchema = z.object({
  name: z.string().min(2, { message: "الاسم مطلوب (حرفان على الأقل)" }).max(120),
  email: z.string().email({ message: "بريد إلكتروني غير صالح" }),
  password: z
    .string()
    .min(8, { message: "كلمة المرور 8 أحرف على الأقل" })
    .max(100, { message: "كلمة المرور طويلة جداً" }),
});
