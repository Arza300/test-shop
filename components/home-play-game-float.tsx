"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const ICON = 96;
/** عرض المحتوى المرئي تقريبيًا لتموضع السهم فوق الزاوية اليمنى */
const ARROW_W = 104;

function subscribeReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function snapshotReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function serverSnapshotReducedMotion() {
  return false;
}

/** أيقونة «العب الآن» أسفل يسار الصفحة الرئيسية — لا يُستخدم إلا بعد التفعيل من الإدارة */
export function HomePlayGameFloat() {
  const [hoverStrong, setHoverStrong] = useState(false);

  /** hover يُحدَّد بـ Pointer API ليكون أكثر اعتمادية من `.group-hover` مع Next/Image وبعض إعدادات «تقليل الحركة» */
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    snapshotReducedMotion,
    serverSnapshotReducedMotion
  );

  return (
    <aside
      className="pointer-events-none fixed bottom-8 left-6 z-50 hidden pb-[env(safe-area-inset-bottom,0)] pl-[env(safe-area-inset-left,0)] sm:bottom-10 sm:left-8 lg:block"
      aria-label="العب الآن — افتح اللعبة من الأيقونة"
    >
      {/*
       * السهم أعلى اليمين نحو الأيقونة؛ الكتلة بدون ميل — النص داخل PNG الأيقونة فقط.
       */}
      <div
        className="opacity-0 motion-safe:animate-play-game-float-enter motion-reduce:!animate-none motion-reduce:opacity-100"
      >
        <div className="relative h-[13.25rem] w-[clamp(10rem,32vw,12.25rem)] sm:h-[12.25rem] sm:w-[11.75rem]">
          <div
            className="pointer-events-none absolute right-7 top-0 w-[68%] max-w-[6.25rem] sm:right-12 sm:top-1 sm:w-[72%] sm:max-w-[6.5rem]"
            aria-hidden
          >
            <Image
              src="/home-play-float/arrow.png"
              alt=""
              width={ARROW_W}
              height={ARROW_W}
              sizes="(max-width: 640px) 28vw, 7rem"
              className="h-auto w-full object-contain object-right-top opacity-[0.98]"
              draggable={false}
            />
          </div>
          <a
            href="/eaglercraft.html"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "pointer-events-auto absolute bottom-0 left-0 isolate cursor-pointer overflow-visible rounded-none border-0 bg-transparent shadow-none outline-none ring-0 [-webkit-tap-highlight-color:transparent]",
              "motion-safe:transition-[transform] motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.4,0,0.2,1)]",
              hoverStrong && "motion-safe:scale-[1.025]",
              "motion-safe:active:scale-[0.985]",
              prefersReducedMotion && "motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/55 focus-visible:ring-offset-0"
            )}
            onPointerEnter={() => setHoverStrong(true)}
            onPointerLeave={() => setHoverStrong(false)}
            aria-label="العب الآن — فتح اللعبة في تبويب جديد"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-[53%] z-0 h-[135%] w-[135%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.2)_0%,rgba(34,197,94,0.07)_46%,transparent_74%)] blur-[16px]"
            />
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute left-1/2 top-[53%] z-0 h-[168%] w-[168%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(209,250,229,0.42)_0%,rgba(52,211,153,0.26)_38%,rgba(34,197,94,0.14)_58%,transparent_78%)] blur-[26px]",
                "transition-opacity",
                prefersReducedMotion ? "duration-150 ease-out" : "duration-[800ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
                hoverStrong ? "opacity-[0.88]" : "opacity-0"
              )}
            />
            <Image
              src="/home-play-float/icon.png"
              alt=""
              width={ICON}
              height={ICON}
              className="relative z-[1] h-[6rem] w-[6rem] select-none rounded-none object-cover shadow-none ring-0 [filter:none] sm:h-[6.375rem] sm:w-[6.375rem]"
              draggable={false}
              priority={false}
            />
          </a>
        </div>
      </div>
    </aside>
  );
}
