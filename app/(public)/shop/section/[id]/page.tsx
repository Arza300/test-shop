import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicPageContainer } from "@/components/public-page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveImageUrlForClient, shouldUnoptimizeImageSrc } from "@/lib/image-url";
import { getVisibleCustomStoreSectionById, getVisibleCustomStoreSectionPageData } from "@/lib/custom-store-sections-public";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { id: string };
  searchParams?: {
    sort?: string;
  };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = params;
  const section = await getVisibleCustomStoreSectionById(id);
  if (!section) {
    return {
      title: "قسم غير موجود",
      description: "هذا القسم غير متاح حاليًا.",
    };
  }
  return {
    title: `${section.title} - المتجر`,
    description: `جميع المنتجات المفعلة داخل قسم ${section.title}.`,
  };
}

function formatEgp(value: string): string {
  const n = Number.parseFloat(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function ShopCustomSectionPage({ params, searchParams }: PageProps) {
  const { id } = params;
  const { section, navItems } = await getVisibleCustomStoreSectionPageData(id);
  if (!section) notFound();

  const sortValue = searchParams?.sort;
  const activeSort = sortValue === "price_asc" || sortValue === "price_desc" ? sortValue : "default";
  const sortedItems =
    activeSort === "default"
      ? section.items
      : [...section.items].sort((a, b) => {
          const aPrice = Number.parseFloat(a.price);
          const bPrice = Number.parseFloat(b.price);
          const safeAPrice = Number.isFinite(aPrice) ? aPrice : Number.POSITIVE_INFINITY;
          const safeBPrice = Number.isFinite(bPrice) ? bPrice : Number.POSITIVE_INFINITY;
          return activeSort === "price_asc" ? safeAPrice - safeBPrice : safeBPrice - safeAPrice;
        });

  const sortActions = [
    { value: "default", label: "الافتراضي", href: `/shop/section/${id}` },
    { value: "price_asc", label: "السعر: من الأقل للأعلى", href: `/shop/section/${id}?sort=price_asc` },
    { value: "price_desc", label: "السعر: من الأعلى للأقل", href: `/shop/section/${id}?sort=price_desc` },
  ];

  return (
    <PublicPageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{section.title}</h1>
          {section.logoDescription ? <p className="mt-2 text-muted-foreground">{section.logoDescription}</p> : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:[direction:ltr]">
          <div className="order-2 space-y-4 lg:order-1">
            <div className="flex flex-wrap items-center justify-end gap-2" dir="rtl">
              {sortActions.map((action) => (
                <Button key={action.value} variant={activeSort === action.value ? "default" : "outline"} size="sm" asChild>
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sortedItems.map((item) => {
                const imageUrl = resolveImageUrlForClient(item.imageUrl) ?? item.imageUrl;
                return (
                  <Link key={item.id} href={`/shop/item/${item.id}`} className="block">
                    <Card className="overflow-hidden border-border/60 bg-card/30 transition hover:-translate-y-0.5 hover:shadow-md">
                      <div className="relative aspect-square w-full overflow-hidden bg-muted">
                        <Image
                          src={imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover object-center"
                          sizes="(min-width: 1280px) 280px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          unoptimized={shouldUnoptimizeImageSrc(imageUrl)}
                        />
                      </div>
                      <CardContent className="space-y-2 pt-4 text-right" dir="rtl">
                        <p className="line-clamp-2 text-base leading-7 [overflow-wrap:anywhere]">{item.title}</p>
                        {item.subtitle ? (
                          <p className="line-clamp-2 text-sm text-muted-foreground [overflow-wrap:anywhere]">
                            {item.subtitle}
                          </p>
                        ) : null}
                        <div className="flex items-baseline justify-end gap-2" dir="ltr">
                          {item.oldPrice ? (
                            <span className="font-figures text-sm text-muted-foreground line-through">
                              {formatEgp(item.oldPrice)} EGP
                            </span>
                          ) : null}
                          <span className="font-figures text-lg font-semibold text-amber-500">
                            {formatEgp(item.price)} EGP
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-xs text-muted-foreground">{item.stock > 0 ? "متوفر" : "غير متوفر"}</span>
                          <span className="inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-sm font-medium">
                            التفاصيل
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          <aside
            className="hidden order-1 sticky top-48 h-fit self-start rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/70 to-slate-950/60 p-4 shadow-[0_10px_35px_rgba(0,0,0,0.35)] lg:order-2 lg:block"
            dir="rtl"
          >
            <div className="mb-3">
              <h2 className="text-base font-semibold text-white">الأقسام</h2>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/shop/section/all"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right text-sm text-white/90 transition hover:border-white/20 hover:bg-white/10"
              >
                عرض الكل
              </Link>
              {navItems.map((item) => {
                const isActive = item.id === id;
                return (
                  <Link
                    key={item.id}
                    href={`/shop/section/${item.id}`}
                    className={
                      isActive
                        ? "rounded-xl border border-amber-400/60 bg-amber-500/15 px-3 py-2 text-right text-sm font-medium text-amber-300"
                        : "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-right text-sm text-white/85 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                    }
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      </div>
    </PublicPageContainer>
  );
}
