"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, House } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/cart-store";
import { useRequireAuthForShopping } from "@/lib/use-require-auth-shopping";
import { shouldUnoptimizeImageSrc } from "@/lib/image-url";
import { toast } from "sonner";

type CustomStoreItemDetail = {
  id: string;
  sectionId: string;
  sectionTitle: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  price: string;
  oldPrice: string | null;
  hasVariants: boolean;
  variants: Array<{ name: string; price: string }>;
  stock: number;
};

function formatMoney(value: string): string {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return value;
  return parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CustomStoreItemPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const add = useCartStore((s) => s.add);
  const { ensureSignedIn, authLoading } = useRequireAuthForShopping();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(-1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["custom-store-item", id],
    queryFn: async () => {
      const response = await fetch(`/api/public/custom-store-items/${encodeURIComponent(id)}`);
      if (!response.ok) throw new Error("not_found");
      return response.json() as Promise<CustomStoreItemDetail>;
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl pt-6 pb-20 sm:pt-8 sm:pb-28">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="w-full max-w-xl">
            <Skeleton className="aspect-square w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-destructive">العنصر غير موجود.</p>;
  }

  const firstImg = data.imageUrl;
  const thumbImages = [data.imageUrl];
  const selectedVariant = data.hasVariants ? data.variants[selectedVariantIndex] ?? null : null;
  const selectedPrice = selectedVariant?.price ?? data.price;
  const canPurchase = data.stock > 0 && (!data.hasVariants || selectedVariant != null);
  const selectedVariantLabel = selectedVariant ? `${selectedVariant.name} - ج.م ${formatMoney(selectedVariant.price)}` : null;
  const addCurrentItemToCart = () => {
    add({
      itemType: "CUSTOM_SECTION_ITEM",
      itemId: data.id,
      title: selectedVariant ? `${data.title} - ${selectedVariant.name}` : data.title,
      price: Number(selectedPrice),
      slug: null,
      imageUrl: data.imageUrl,
      variantName: selectedVariant?.name,
      variantPrice: selectedVariant ? Number(selectedVariant.price) : undefined,
      quantity: 1,
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl pt-6 pb-20 sm:pt-8 sm:pb-28">
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-card/40 p-2 sm:mb-6">
        <Button
          type="button"
          variant="ghost"
          className="gap-2 rounded-lg text-foreground/90 hover:bg-muted"
          onClick={() => router.back()}
        >
          <ChevronRight className="h-4 w-4" />
          رجوع للخلف
        </Button>
        <Button type="button" variant="ghost" className="gap-2 rounded-lg text-foreground/80 hover:bg-muted" asChild>
          <Link href="/">
            <House className="h-4 w-4" />
            الصفحة الرئيسية
          </Link>
        </Button>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10">
        <div className="space-y-3">
          <div className="w-full max-w-xl">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-sm">
          <Image
            src={firstImg}
            alt={data.title}
            fill
            className="object-cover"
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            unoptimized={shouldUnoptimizeImageSrc(firstImg)}
          />
            </div>
          </div>
        </div>
        {thumbImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {thumbImages.map((img) => (
              <div key={img} className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border">
                <Image
                  src={img}
                  alt={data.title}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized={shouldUnoptimizeImageSrc(img)}
                />
              </div>
            ))}
          </div>
        )}
        <div className="space-y-5 rounded-2xl border border-border/60 bg-card/40 p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <Badge>منتج قسم</Badge>
            <Badge variant="secondary">{data.sectionTitle}</Badge>
            <Badge variant="outline">{data.stock > 0 ? "متوفر" : "غير متوفر"}</Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">{data.title}</h1>
          <div className="space-y-1 rounded-xl border border-primary/25 bg-primary/5 p-4">
            <p className="text-sm font-medium text-muted-foreground">السعر الحالي</p>
            <p className="font-figures text-3xl font-bold tabular-nums leading-normal text-primary">
              ج.م {formatMoney(selectedPrice)}
            </p>
            {data.hasVariants ? (
              <p className="text-xs text-muted-foreground">
                {selectedVariant ? `النوع المختار: ${selectedVariant.name}` : "اختر النوع لعرض السعر النهائي وإتمام الشراء"}
              </p>
            ) : null}
          </div>
          {data.hasVariants ? (
            <div className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-4">
              <p className="text-sm font-semibold text-foreground">اختر النوع</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.variants.map((variant, idx) => {
                  const isSelected = idx === selectedVariantIndex;
                  return (
                    <button
                      key={`${variant.name}-${idx}`}
                      type="button"
                      className={`rounded-lg border px-3 py-2 text-right transition ${
                        isSelected
                          ? "border-cyan-500 bg-cyan-500/10 text-cyan-100"
                          : "border-border/70 bg-card/30 text-foreground hover:border-cyan-500/50"
                      }`}
                      onClick={() => setSelectedVariantIndex(idx)}
                    >
                      <p className="text-sm font-semibold">{variant.name}</p>
                      <p className="font-figures text-sm text-muted-foreground">ج.م {formatMoney(variant.price)}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          {data.subtitle ? <p className="whitespace-pre-wrap text-muted-foreground">{data.subtitle}</p> : null}
          <p className="font-figures text-sm tabular-nums leading-normal text-muted-foreground">
            {data.stock > 0 ? `${data.stock} متوفر في المخزون` : "غير متوفر"}
          </p>
          {data.oldPrice ? (
            <div className="flex items-baseline gap-2">
              <span className="font-figures text-sm text-muted-foreground">السعر السابق:</span>
              <span className="font-figures text-muted-foreground line-through">ج.م {formatMoney(data.oldPrice)}</span>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              disabled={!canPurchase || authLoading}
              onClick={() => {
                if (!ensureSignedIn()) return;
                if (data.hasVariants && !selectedVariant) {
                  toast.error("اختر النوع أولاً قبل الإضافة للسلة");
                  return;
                }
                addCurrentItemToCart();
                toast.success("تمت الإضافة للسلة");
              }}
            >
              أضف للسلة
            </Button>
            <Button
              size="lg"
              variant="secondary"
              disabled={!canPurchase || authLoading}
              onClick={() => {
                if (!ensureSignedIn("/cart")) return;
                if (data.hasVariants && !selectedVariant) {
                  toast.error("اختر النوع أولاً قبل الشراء");
                  return;
                }
                addCurrentItemToCart();
                toast.success("تمت إضافة المنتج والتحويل إلى السلة");
                router.push("/cart");
              }}
            >
              شراء الآن
            </Button>
          </div>
          <Separator />
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">نوع العنصر</p>
            <p className="font-medium">منتج مضاف داخل قسم المتجر</p>
            {selectedVariantLabel ? <p className="text-sm text-muted-foreground">{selectedVariantLabel}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
