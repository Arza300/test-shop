"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { shouldUnoptimizeImageSrc } from "@/lib/image-url";

type CustomStoreSectionView = {
  id: string;
  title: string;
  showTitle: boolean;
  logoUrl: string | null;
  logoTitle: string | null;
  logoDescription: string | null;
  backgroundColor: string | null;
  cardBackgroundColor: string | null;
  items: Array<{
    id: string;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    price: string;
    oldPrice: string | null;
  }>;
};

function formatPrice(value: string): string {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return value;
  return parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CustomStoreSectionBlock({ section }: { section: CustomStoreSectionView }) {
  const [startIndex, setStartIndex] = useState(0);
  const hasLogoImage = Boolean(section.logoUrl);
  const visibleCardsCount = hasLogoImage ? 3 : 4;
  const hasMoreThanVisibleCards = section.items.length > visibleCardsCount;
  const maxStartIndex = Math.max(0, section.items.length - visibleCardsCount);

  useEffect(() => {
    setStartIndex((prev) => Math.min(prev, maxStartIndex));
  }, [maxStartIndex]);

  const visibleCards = useMemo(
    () =>
      hasMoreThanVisibleCards
        ? section.items.slice(startIndex, startIndex + visibleCardsCount)
        : section.items.slice(0, visibleCardsCount),
    [section.items, hasMoreThanVisibleCards, startIndex, visibleCardsCount]
  );

  return (
    <div
      className={
        section.backgroundColor
          ? "rounded-xl border border-[#234ea9] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.35)] sm:p-4"
          : "rounded-xl border border-[#1b2436] bg-transparent p-3 sm:p-4"
      }
      style={section.backgroundColor ? { backgroundColor: section.backgroundColor } : undefined}
    >
      {section.showTitle || hasMoreThanVisibleCards ? (
        <div dir="rtl" className="mb-4 flex items-center justify-between gap-3">
          {section.showTitle ? (
            <h2 className="text-right text-xl font-black leading-tight text-white sm:text-2xl">{section.title}</h2>
          ) : (
            <span />
          )}
          {hasMoreThanVisibleCards ? (
            <Link
              href={`/shop/section/${section.id}`}
              className="rounded-md border border-white/40 bg-transparent px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              تصفح الكل
            </Link>
          ) : null}
        </div>
      ) : null}

      <div dir="ltr" className={hasLogoImage ? "grid gap-3 lg:grid-cols-[3fr_1fr]" : "grid gap-3"}>
        <div className="relative order-2 lg:order-1">
          {hasMoreThanVisibleCards ? (
            <button
              type="button"
              aria-label="عرض الكروت السابقة"
              onClick={() => setStartIndex((prev) => Math.max(0, prev - 1))}
              disabled={startIndex === 0}
              className="absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-transparent p-2 text-white shadow-md transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}

          <div className={hasLogoImage ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-4"}>
            {visibleCards.map((item) => {
              const cardColor = section.cardBackgroundColor;
              return (
                <Link key={item.id} href={`/shop/item/${item.id}`} className="block">
                  <article
                    className={
                      cardColor
                        ? "rounded-md border border-[#214aa2] p-2 text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:brightness-110"
                        : "rounded-md border border-[#214aa2] bg-[#072d84] p-2 text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition hover:-translate-y-0.5 hover:brightness-110"
                    }
                    style={cardColor ? { backgroundColor: cardColor, borderColor: cardColor } : undefined}
                  >
                    <div
                      className="rounded-sm border border-[#2d5bbd] bg-[#0a45b2] p-1"
                      style={cardColor ? { backgroundColor: cardColor, borderColor: cardColor } : undefined}
                    >
                      <div
                        className="relative aspect-square w-full overflow-hidden rounded-sm bg-[#0e5cd0]"
                        style={cardColor ? { backgroundColor: cardColor } : undefined}
                      >
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover object-center"
                          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 48vw, 100vw"
                          unoptimized={shouldUnoptimizeImageSrc(item.imageUrl)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2 px-1 pb-1 pt-3 text-center">
                      <p dir="auto" className="line-clamp-2 min-h-9 text-base leading-7 text-white hover:underline">
                        {item.title}
                      </p>
                      {item.subtitle ? (
                        <p dir="auto" className="line-clamp-2 min-h-8 text-sm leading-6 text-blue-100/80">
                          {item.subtitle}
                        </p>
                      ) : null}
                      <p
                        dir="ltr"
                        className="min-w-0 text-[18px] font-black tracking-tight text-white [unicode-bidi:isolate]"
                      >
                        <span className="inline-block whitespace-nowrap">EGP {formatPrice(item.price)}</span>
                      </p>
                      {item.oldPrice ? (
                        <p dir="ltr" className="text-xs text-blue-100/70 line-through">
                          EGP {formatPrice(item.oldPrice)}
                        </p>
                      ) : null}
                      <span className="inline-flex items-center justify-center rounded-md border border-white/30 px-3 py-1.5 text-xs font-semibold text-white">
                        عرض التفاصيل
                      </span>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>

          {hasMoreThanVisibleCards ? (
            <button
              type="button"
              aria-label="عرض الكروت التالية"
              onClick={() => setStartIndex((prev) => Math.min(maxStartIndex, prev + 1))}
              disabled={startIndex >= maxStartIndex}
              className="absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-transparent p-2 text-white shadow-md transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          ) : null}
        </div>

        {hasLogoImage ? (
          <aside className="order-1 flex flex-col items-center justify-center rounded-md bg-transparent px-4 py-5 text-center text-white lg:order-2">
            {section.logoUrl ? (
              <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-md">
                <Image
                  src={section.logoUrl}
                  alt={section.logoTitle ?? section.title}
                  fill
                  className="object-contain mix-blend-screen"
                  sizes="176px"
                  unoptimized={shouldUnoptimizeImageSrc(section.logoUrl)}
                />
              </div>
            ) : null}
            {section.logoTitle ? (
              <p className="mt-3 text-4xl font-black leading-tight">{section.logoTitle}</p>
            ) : null}
            {section.logoDescription ? (
              <p className="mx-auto mt-3 max-w-[260px] text-base leading-8 text-blue-100/90">
                {section.logoDescription}
              </p>
            ) : null}
          </aside>
        ) : null}
      </div>
    </div>
  );
}

export function CustomStoreSectionShowcaseItem({ section }: { section: CustomStoreSectionView }) {
  return (
    <section className="border-b border-white/5 bg-store-bg py-6 sm:py-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-3 sm:px-4">
        <CustomStoreSectionBlock section={section} />
      </div>
    </section>
  );
}

export function CustomStoreSectionsShowcase({ sections }: { sections: CustomStoreSectionView[] }) {
  if (!sections.length) return null;

  return (
    <section className="border-b border-white/5 bg-store-bg py-6 sm:py-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-3 sm:px-4">
        {sections.map((section) => (
          <CustomStoreSectionBlock key={section.id} section={section} />
        ))}
      </div>
    </section>
  );
}
