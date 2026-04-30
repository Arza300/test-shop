"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";

/**
 * يمنع إضافة منتجات أو إتمام الشراء قبل تسجيل الدخول.
 * يعيد توجيه المستخدم إلى صفحة الدخول مع callbackUrl وتنبيه.
 */
export function useRequireAuthForShopping() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const ensureSignedIn = useCallback(
    (returnTo?: string) => {
      if (status === "loading") return false;
      if (session?.user) return true;
      const path =
        returnTo ??
        (typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/");
      toast.info("سجّل الدخول أو أنشئ حساباً لإضافة المنتجات وإتمام الشراء.", {
        duration: 6000,
      });
      router.push(`/auth/sign-in?callbackUrl=${encodeURIComponent(path)}`);
      return false;
    },
    [session, status, router]
  );

  return { ensureSignedIn, authLoading: status === "loading" };
}
