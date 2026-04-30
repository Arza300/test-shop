"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shouldUnoptimizeImageSrc } from "@/lib/image-url";

export default function CartPage() {
  const { items, setQty, remove, clear } = useCartStore();
  const sub = cartSubtotal(items);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">سلة المشتريات</h1>
      {items.length === 0 ? (
        <p className="text-muted-foreground">
          السلة فارغة.{" "}
          <Link className="text-primary underline" href="/">
            تصفّح المتجر
          </Link>
          .
        </p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>العناصر</CardTitle>
                <Button type="button" variant="ghost" size="sm" onClick={clear}>
                  إفراغ السلة
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((l) => (
                <div
                  key={`${l.itemType}:${l.itemId}:${l.variantName ?? "base"}`}
                  className="flex flex-col gap-3 border-b border-border/60 py-3 last:border-0 sm:flex-row sm:items-center"
                >
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                    {l.imageUrl && !l.imageUrl.startsWith("r2://") ? (
                      <Image
                        src={l.imageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized={shouldUnoptimizeImageSrc(l.imageUrl)}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    {l.itemType === "CUSTOM_SECTION_ITEM" ? (
                      <Link
                        href={`/shop/item/${l.itemId}`}
                        className="font-medium hover:underline"
                      >
                        {l.title}
                      </Link>
                    ) : (
                      <p className="font-medium">{l.title}</p>
                    )}
                    <p className="font-figures text-sm tabular-nums leading-normal text-muted-foreground">
                      ${l.price} للواحد
                    </p>
                    {l.variantName ? (
                      <p className="text-xs text-muted-foreground">النوع المختار: {l.variantName}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      className="w-16"
                      type="number"
                      min={1}
                      value={l.quantity}
                      onChange={(e) => setQty(l.itemType, l.itemId, Number(e.target.value) || 1, l.variantName)}
                    />
                    <Button type="button" variant="secondary" onClick={() => remove(l.itemType, l.itemId, l.variantName)}>
                      إزالة
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>الملخص</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">المجموع الفرعي</p>
              <p className="font-figures text-2xl font-bold tabular-nums leading-normal">${sub.toFixed(2)}</p>
              <Button asChild className="w-full" size="lg">
                <Link href="/checkout/payment-method">إتمام الطلب</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
