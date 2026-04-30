import Image from "next/image";
import Link from "next/link";
import { shouldUnoptimizeImageSrc } from "@/lib/image-url";
import { cn } from "@/lib/utils";

export type LeadingBrandTile = {
  slug: string;
  name: string;
  logoUrl: string;
};

const TITLE = "العلامات التجارية الرائدة";
const SUBTITLE =
  "تصفّح أكبر الأسماء في عالم الألعاب وأجهزة الكونسول والإكسسوارات — من بلايستيشن ونينتندو إلى ميتا وإكس بوكس. اكتشف العلامات التجارية الموثوقة التي ترسم مستقبل اللعب.";

type Props = {
  brands: LeadingBrandTile[];
  className?: string;
};

export function LeadingBrandsSection({ brands, className }: Props) {
  if (!brands.length) return null;

  return (
    <section className={cn("mx-auto w-full max-w-[1400px] px-4", className)} dir="rtl">
      <div className="rounded-3xl border border-white/10 bg-black/45 px-4 py-8 shadow-inner shadow-black/40 backdrop-blur-sm sm:px-8 sm:py-10">
        <header className="mb-8 text-center">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">{TITLE}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">{SUBTITLE}</p>
        </header>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {brands.map((b) => (
            <Link
              key={b.slug}
              href={`/shop?brand=${encodeURIComponent(b.slug)}`}
              className="group flex aspect-[5/3] items-center justify-center rounded-2xl border border-white/5 bg-slate-900/80 p-4 transition-colors hover:border-cyan-500/25 hover:bg-slate-800/90"
            >
              <div className="relative h-full w-full max-h-[72px] min-h-[40px] max-w-[160px]">
                <Image
                  src={b.logoUrl}
                  alt={b.name}
                  fill
                  className="object-contain opacity-95 transition-opacity group-hover:opacity-100"
                  sizes="(min-width: 1024px) 200px, 33vw"
                  unoptimized={shouldUnoptimizeImageSrc(b.logoUrl)}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
