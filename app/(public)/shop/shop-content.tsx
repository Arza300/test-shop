"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { shouldUnoptimizeImageSrc } from "@/lib/image-url";
import { SearchCat } from "@/components/shop/search-cat";
import { useCartStore } from "@/lib/cart-store";
import { useRequireAuthForShopping } from "@/lib/use-require-auth-shopping";
import { toast } from "sonner";

type ProductListItem = {
  itemType: "CUSTOM_SECTION_ITEM";
  id: string;
  title: string;
  slug: null;
  price: string;
  stock: number;
  imageUrl?: string | null;
  sectionId?: string | null;
  sectionTitle?: string | null;
};

type CatalogResponse = {
  items: ProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  matchedSections?: Array<{ id: string; title: string }>;
};

function useProductList() {
  const searchParams = useSearchParams();
  return useQuery({
    queryKey: ["catalog", searchParams.toString()],
    queryFn: async () => {
      const u = new URL("/api/public/catalog", window.location.origin);
      searchParams.forEach((v, k) => u.searchParams.set(k, v));
      const r = await fetch(u.toString());
      if (!r.ok) throw new Error("تعذّر تحميل عناصر المتجر");
      return r.json() as Promise<CatalogResponse>;
    },
  });
}

export function ShopContent() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const brandSlug = sp.get("brand");
  const { data, isLoading, isError } = useProductList();
  const { data: brandsLookup } = useQuery({
    queryKey: ["public-brands"],
    queryFn: async () => {
      const r = await fetch("/api/public/brands");
      if (!r.ok) return { items: [] as { slug: string; name: string }[] };
      return r.json() as Promise<{ items: { slug: string; name: string }[] }>;
    },
    enabled: Boolean(brandSlug),
  });
  const brandLabel = brandSlug
    ? brandsLookup?.items.find((b) => b.slug === brandSlug)?.name ?? brandSlug
    : null;
  const [qInput, setQInput] = useState(sp.get("q") ?? "");
  const [catAwake, setCatAwake] = useState(false);
  const addToCart = useCartStore((s) => s.add);
  const { ensureSignedIn, authLoading } = useRequireAuthForShopping();

  useEffect(() => {
    setQInput(sp.get("q") ?? "");
  }, [sp]);

  const setParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(sp.toString());
    if (value == null || value === "" || value === "all") p.delete(key);
    else p.set(key, value);
    p.set("page", "1");
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">المتجر</h1>
        <p className="text-muted-foreground">تصفح عناصر الأقسام المخصصة فقط.</p>
      </div>
      {brandSlug ? (
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-500/25 bg-cyan-950/25 px-3 py-2.5 text-sm"
          dir="rtl"
        >
          <span>
            تصفية العلامة: <span className="font-semibold text-foreground">{brandLabel}</span>
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => setParam("brand", null)}>
            إلغاء التصفية
          </Button>
        </div>
      ) : null}
      <div className="grid gap-4 rounded-xl border border-border/60 bg-card/30 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <Label htmlFor="q" className="text-xs text-muted-foreground">
            بحث
          </Label>
          <div
            className="relative mt-1"
            onMouseEnter={() => setCatAwake(true)}
            onMouseLeave={() => setCatAwake(false)}
            onFocus={() => setCatAwake(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setCatAwake(false);
              }
            }}
          >
            <SearchCat awake={catAwake} />
            <div className="flex gap-2">
            <Input
              id="q"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const p = new URLSearchParams(sp.toString());
                  if (qInput.trim()) p.set("q", qInput.trim());
                  else p.delete("q");
                  p.set("page", "1");
                  router.push(`${pathname}?${p.toString()}`);
                }
              }}
              placeholder="ابحث في أسماء المنتجات…"
              className="pe-16"
            />
            <Button
              type="button"
              onMouseEnter={() => setCatAwake(true)}
              onMouseLeave={() => setCatAwake(false)}
              onClick={() => {
                const p = new URLSearchParams(sp.toString());
                if (qInput.trim()) p.set("q", qInput.trim());
                else p.delete("q");
                p.set("page", "1");
                router.push(`${pathname}?${p.toString()}`);
              }}
            >
              بحث
            </Button>
            </div>
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">أقل سعر</Label>
          <Input
            className="mt-1"
            type="number"
            min={0}
            defaultValue={sp.get("min") ?? ""}
            onBlur={(e) => setParam("min", e.target.value || null)}
            placeholder="0"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">أعلى سعر</Label>
          <Input
            className="mt-1"
            type="number"
            min={0}
            defaultValue={sp.get("max") ?? ""}
            onBlur={(e) => setParam("max", e.target.value || null)}
            placeholder="200"
          />
        </div>
      </div>
      {isError && (
        <p className="text-destructive">تعذّر تحميل المنتجات. تأكد أن قاعدة البيانات تعمل.</p>
      )}
      {data && data.matchedSections && data.matchedSections.length > 0 ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 p-3" dir="rtl">
          <p className="mb-2 text-sm text-amber-100">أقسام مطابقة لبحثك:</p>
          <div className="flex flex-wrap gap-2">
            {data.matchedSections.map((section) => (
              <Button key={section.id} size="sm" variant="outline" asChild>
                <Link href={`/shop/section/${section.id}`}>{section.title}</Link>
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      )}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((p) => (
            <Card key={p.id} className="overflow-hidden border-border/60 transition-shadow hover:shadow-md">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                {p.imageUrl && !p.imageUrl.startsWith("r2://") ? (
                  <Image
                    src={p.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 320px, 50vw"
                    unoptimized={shouldUnoptimizeImageSrc(p.imageUrl)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">لا صورة</div>
                )}
              </div>
              <CardHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">عنصر مخصص</Badge>
                </div>
                <CardTitle className="line-clamp-2 text-lg">{p.title}</CardTitle>
                <CardDescription>
                  {p.sectionTitle ? (
                    <>
                      قسم: {p.sectionTitle} ·{" "}
                    </>
                  ) : null}
                  {p.stock > 0 ? "متوفر" : "غير متوفر"}
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex items-center justify-between border-t border-border/60">
                <span className="font-figures text-lg font-semibold tabular-nums leading-normal">${p.price}</span>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/shop/item/${p.id}`}>التفاصيل</Link>
                  </Button>
                  <Button
                    size="sm"
                    disabled={p.stock < 1 || authLoading}
                    onClick={() => {
                      if (!ensureSignedIn()) return;
                      addToCart({
                        itemType: p.itemType,
                        itemId: p.id,
                        title: p.title,
                        price: Number(p.price),
                        slug: p.slug,
                        imageUrl: p.imageUrl ?? undefined,
                        quantity: 1,
                      });
                      toast.success("تمت الإضافة للسلة");
                    }}
                  >
                    أضف للسلة
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {data && data.items.length === 0 && (
        <p className="text-muted-foreground">لا توجد منتجات تطابق التصفية.</p>
      )}
    </div>
  );
}
