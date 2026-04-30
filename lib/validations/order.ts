import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const sellableItemTypeSchema = z.enum(["CUSTOM_SECTION_ITEM"]);

export const checkoutSchema = z.object({
  paymentMethodId: z.string().cuid({ message: "طريقة الدفع غير صالحة" }),
  items: z
    .array(
      z.object({
        itemType: sellableItemTypeSchema,
        itemId: z.string().cuid({ message: "معرّف عنصر غير صالح" }),
        variantName: z.string().trim().min(1).max(120).optional(),
        quantity: z.coerce.number().int().min(1).max(99),
      })
    )
    .min(1, { message: "أضف منتجاً واحداً على الأقل" })
    .max(50, { message: "عدد المنتجات كبير جداً" }),
});

export const orderStatusUpdateSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});
