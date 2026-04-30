import type { Platform, ProductType } from "@prisma/client";

export function typeLabelAr(t: ProductType | string): string {
  switch (t) {
    case "GAME":
      return "لعبة";
    case "GIFT_CARD":
      return "بطاقة هدايا";
    case "ACCESSORY":
      return "إكسسوار";
    default:
      return t;
  }
}

export function platformLabelAr(p: Platform | string): string {
  switch (p) {
    case "PLAYSTATION":
      return "بلايستيشن";
    case "XBOX":
      return "إكس بوكس";
    case "PC":
      return "كمبيوتر";
    case "OTHER":
      return "أخرى";
    default:
      return p;
  }
}

export function formatLabelAr(f: string): string {
  switch (f) {
    case "DIGITAL":
      return "رقمي";
    case "PHYSICAL":
      return "مادي";
    default:
      return f;
  }
}

const orderStatusAr: Record<string, string> = {
  PENDING: "معلّق / قيد المراجعة",
  PAID: "مدفوع",
  SHIPPED: "تم الشحن",
  COMPLETED: "تم اكتمال الطلب",
};

export function orderStatusLabelAr(s: string): string {
  return orderStatusAr[s] ?? s;
}

export function userRoleLabelAr(role: string): string {
  if (role === "ADMIN") return "مدير";
  if (role === "USER") return "مستخدم";
  return role;
}
