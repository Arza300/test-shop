"use client";

import Image from "next/image";
import { Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { shouldUnoptimizeImageSrc } from "@/lib/image-url";
import { supportPhoneToTelHref } from "@/lib/support-phone-tel";

const DEFAULT_TOP_STRIP_IMAGE = "/payments-strip.png";

export function StoreTopBar() {
  const [topStripImageUrl, setTopStripImageUrl] = useState(DEFAULT_TOP_STRIP_IMAGE);
  const [supportPhoneDisplay, setSupportPhoneDisplay] = useState("");
  const phoneTelHref =
    supportPhoneDisplay.trim() !== "" ? supportPhoneToTelHref(supportPhoneDisplay) : null;

  useEffect(() => {
    let alive = true;
    fetch("/api/public/site-branding")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { topStripImageUrl?: string | null; supportPhone?: string | null } | null) => {
        if (!alive) return;
        setTopStripImageUrl(d?.topStripImageUrl || DEFAULT_TOP_STRIP_IMAGE);
        setSupportPhoneDisplay(d?.supportPhone?.trim() ?? "");
      })
      .catch(() => {
        if (!alive) return;
        setTopStripImageUrl(DEFAULT_TOP_STRIP_IMAGE);
        setSupportPhoneDisplay("");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="border-b border-white/5 bg-black">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-2 py-1.5 sm:px-4 sm:py-2">
        <div className="relative min-h-[28px] min-w-0 flex-1 sm:min-h-[32px] md:min-h-[40px]">
          <Image
            src={topStripImageUrl}
            alt="طرق الدفع والتقسيط — valU، فوري، أمان، ميزة، أورنج ماني، وغيرها"
            fill
            className="object-contain object-center sm:object-center"
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
            unoptimized={shouldUnoptimizeImageSrc(topStripImageUrl)}
          />
        </div>
        {phoneTelHref ? (
          <a
            href={phoneTelHref}
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-amber-300 hover:text-amber-200 sm:text-base"
          >
            <Phone className="h-4 w-4 shrink-0" />
            {supportPhoneDisplay}
          </a>
        ) : null}
      </div>
    </div>
  );
}
