"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shouldUnoptimizeImageSrc } from "@/lib/image-url";
import { cn } from "@/lib/utils";

export type HomeHeroSlideVisual = {
  image: string;
  title: string;
  sub: string;
  gradient: string;
  href?: string;
};

const AUTO_MS = 5000;

const SLIDE_LAYER_BASE: CSSProperties = {
  willChange: "opacity",
  backfaceVisibility: "hidden",
};

/** منحنى مادة قياسي: تسارع/تباطؤ ناعم دون مفاجأة */
function slideLayerTransition(reducedMotion: boolean): CSSProperties {
  return {
    ...SLIDE_LAYER_BASE,
    transition: reducedMotion
      ? "opacity 0.28s linear"
      : "opacity 1.45s cubic-bezier(0.4, 0, 0.2, 1)",
  };
}

type Props = {
  /** من قاعدة البيانات فقط؛ إن كانت فارغة يُعرض فراغ ترويجي بسيط. */
  slides: HomeHeroSlideVisual[];
  /** صورة البطاقة الجانبية المتوهجة (اختياري). */
  sidePanelImageUrl?: string | null;
  /** رابط البطاقة الجانبية (اختياري). */
  sidePanelHref?: string;
};

export function HomeHeroSection({ slides, sidePanelImageUrl, sidePanelHref }: Props) {
  const list = slides;
  const hasSidePanelImage = Boolean(sidePanelImageUrl);
  const [i, setI] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const listLenRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  listLenRef.current = list.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setI((prev) => (list.length ? prev % list.length : 0));
  }, [list.length]);

  const tickNext = useCallback(() => {
    setI((v) => {
      const n = listLenRef.current;
      if (n < 2) return v;
      return (v + 1) % n;
    });
  }, []);

  const next = useCallback(() => {
    setI((v) => (list.length ? (v + 1) % list.length : 0));
  }, [list.length]);

  const prev = useCallback(() => {
    setI((v) => (list.length ? (v - 1 + list.length) % list.length : 0));
  }, [list.length]);

  // مؤقّت ثابت: لا يعاد ربطه عند تغيّر i (هذا كان يلغي الانتظام أحياناً)
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (list.length < 2) return;
    timerRef.current = setInterval(tickNext, AUTO_MS);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [list.length, tickNext]);

  const showNav = list.length > 1;

  return (
    <section className="border-b border-white/5 bg-store-bg">
      <div className="mx-auto grid max-w-[1400px] gap-3 px-3 py-5 sm:px-4 sm:py-6 lg:grid-cols-4">
        <div
          className={cn(
            "relative min-h-[260px] overflow-hidden rounded-lg border border-white/10 bg-black sm:min-h-[330px] lg:min-h-[400px] xl:min-h-[440px]",
            hasSidePanelImage ? "lg:col-span-3" : "lg:col-span-4"
          )}
        >
          {!list.length ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-6 text-center">
              <p className="text-sm text-zinc-500">لا توجد صور في السلايدر حالياً.</p>
            </div>
          ) : (
            <>
              {list.map((slide, idx) => {
                const active = idx === i;
                const showCaption = Boolean(slide.title?.trim() || slide.sub?.trim());
                return (
                  <div
                    key={`${slide.image}-${idx}`}
                    style={slideLayerTransition(reducedMotion)}
                    className={cn(
                      "absolute inset-0",
                      active ? "z-[2] opacity-100" : "z-0 opacity-0",
                      active && slide.href ? "pointer-events-auto" : "pointer-events-none"
                    )}
                    aria-hidden={!active}
                  >
                    {slide.href ? (
                      <Link
                        href={slide.href}
                        className="absolute inset-0 z-[3]"
                        aria-label="فتح المنتج"
                      />
                    ) : null}
                    {showCaption && (
                      <div
                        className={cn(
                          "absolute inset-0 z-[1] bg-gradient-to-br opacity-90",
                          slide.gradient
                        )}
                      />
                    )}
                    <Image
                      src={slide.image}
                      alt=""
                      fill
                      className={showCaption ? "object-cover opacity-70" : "object-cover opacity-100"}
                      priority={idx === 0}
                      sizes="(min-width: 1024px) 75vw, 100vw"
                      unoptimized={shouldUnoptimizeImageSrc(slide.image)}
                    />
                    {showCaption && (
                      <div className="absolute inset-0 z-[2] flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 sm:p-6">
                        {slide.sub.trim() ? (
                          <p className="text-xs font-medium text-white/70 sm:text-sm">{slide.sub}</p>
                        ) : null}
                        {slide.title.trim() ? (
                          <h2 className="text-2xl font-bold text-white sm:text-4xl lg:text-5xl">
                            {slide.title}
                          </h2>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}

              {showNav && (
                <>
                  <div className="absolute inset-y-0 left-0 z-10 flex items-center p-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="pointer-events-auto h-10 w-10 rounded-full border-0 bg-white/20 text-white backdrop-blur hover:bg-white/30"
                      onClick={prev}
                      aria-label="السابق"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                  </div>
                  <div className="absolute inset-y-0 right-0 z-10 flex items-center p-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="pointer-events-auto h-10 w-10 rounded-full border-0 bg-white/20 text-white backdrop-blur hover:bg-white/30"
                      onClick={next}
                      aria-label="التالي"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {hasSidePanelImage ? (
          <aside className="relative hidden min-h-[220px] overflow-hidden rounded-lg border border-emerald-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-black shadow-[0_0_30px_rgba(16,185,129,0.15)] lg:col-span-1 lg:flex lg:min-h-0 lg:flex-col lg:justify-between">
            {sidePanelHref ? <Link href={sidePanelHref} className="absolute inset-0 z-[2]" aria-label="فتح الرابط المرتبط" /> : null}
            <div className="absolute inset-0">
              <Image
                src={sidePanelImageUrl!}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 24vw, 30vw"
                unoptimized={shouldUnoptimizeImageSrc(sidePanelImageUrl!)}
              />
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
