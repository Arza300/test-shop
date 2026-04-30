"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type PaymentMethod = {
  id: string;
  name: string;
  phoneNumber: string;
  transferProofInstruction: string;
  supportNumber: string | null;
};

export default function CheckoutPaymentMethodPage() {
  const router = useRouter();
  const { items, selectedPaymentMethodId, setSelectedPaymentMethodId, clear } = useCartStore();
  const sub = cartSubtotal(items);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methodsQuery = useQuery({
    queryKey: ["public-payment-methods"],
    queryFn: async () => {
      const res = await fetch("/api/public/payment-methods");
      const json = (await res.json().catch(() => ({}))) as { items?: PaymentMethod[]; error?: string };
      if (!res.ok) throw new Error(json.error || "فشل تحميل طرق الدفع");
      return json.items ?? [];
    },
  });

  const methods = useMemo(() => methodsQuery.data ?? [], [methodsQuery.data]);
  const selectedMethod = methods.find((method) => method.id === selectedPaymentMethodId) ?? null;

  const handlePaidClick = async () => {
    if (!selectedMethod || !items.length || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethodId: selectedMethod.id,
          items: items
            .filter((i) => i.itemType === "CUSTOM_SECTION_ITEM")
            .map((i) => ({
              itemType: "CUSTOM_SECTION_ITEM" as const,
              itemId: i.itemId,
              variantName: i.variantName,
              quantity: i.quantity,
            })),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(json.error || "تعذّر إرسال الطلب");
        return;
      }
      clear();
      toast.success("طلبك قيد المراجعة وسيتم تسليمك المنتج في غضون دقائق.");
      router.push("/checkout/reviewing");
    } catch {
      toast.error("حدث خطأ غير متوقع أثناء إرسال الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!methods.length) return;
    if (!selectedPaymentMethodId || !methods.some((method) => method.id === selectedPaymentMethodId)) {
      setSelectedPaymentMethodId(methods[0]!.id);
    }
  }, [methods, selectedPaymentMethodId, setSelectedPaymentMethodId]);

  if (!items.length) {
    return (
      <p>
        السلة فارغة.{" "}
        <Link href="/shop" className="text-primary underline">
          تصفّح المتجر
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">اختيار طريقة الدفع</h1>
        <p className="mt-1 text-sm text-muted-foreground">اختر طريقة مناسبة ثم أكمل إدخال بيانات الطلب.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إجمالي المنتجات</CardTitle>
          <CardDescription>هذا هو الإجمالي الحالي للعناصر في السلة.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="font-figures text-2xl font-bold tabular-nums leading-normal">${sub.toFixed(2)}</p>
        </CardContent>
      </Card>

      {methodsQuery.isLoading ? <p className="text-sm text-muted-foreground">جاري تحميل طرق الدفع...</p> : null}
      {!methodsQuery.isLoading && methods.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا توجد طرق دفع متاحة حالياً. حاول مرة أخرى لاحقاً.</p>
      ) : null}

      <div className="grid gap-4">
        {methods.map((method) => {
          const isSelected = method.id === selectedPaymentMethodId;
          return (
            <Card
              key={method.id}
              className={isSelected ? "border-primary" : undefined}
              role="button"
              onClick={() => setSelectedPaymentMethodId(method.id)}
            >
              <CardHeader>
                <CardTitle>{method.name}</CardTitle>
                <CardDescription>{isSelected ? "تم اختيار هذه الطريقة" : "اضغط للاختيار"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  رقم التحويل/الواتساب: <span className="font-medium">{method.phoneNumber}</span>
                </p>
                <p>{method.transferProofInstruction}</p>
                {method.supportNumber ? (
                  <p>
                    رقم الدعم: <span className="font-medium">{method.supportNumber}</span>
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href="/cart">العودة للسلة</Link>
        </Button>
        <div className="flex max-w-xl flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            بعد إتمام الدفع بنجاح وإرسال صورة تأكيد التحويل إلى رقم الواتساب الخاص بطريقة الدفع المختارة، اضغط
            على زر <span className="font-semibold text-foreground">تم الدفع</span>.
          </p>
          <Button disabled={!selectedMethod || isSubmitting} onClick={handlePaidClick}>
            {isSubmitting ? "جاري إرسال الطلب..." : "تم الدفع"}
          </Button>
        </div>
      </div>
    </div>
  );
}
