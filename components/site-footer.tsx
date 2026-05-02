import Link from "next/link";
import Image from "next/image";
import { shouldUnoptimizeImageSrc } from "@/lib/image-url";

type SiteFooterProps = {
  brandName?: string | null;
  brandLogoUrl?: string | null;
};

export function SiteFooter({ brandName = null, brandLogoUrl = null }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10 bg-store-header/80">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-white/50">
          {brandLogoUrl ? (
            <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full shadow-md">
              <Image
                src={brandLogoUrl}
                alt=""
                fill
                className="object-cover"
                sizes="32px"
                unoptimized={shouldUnoptimizeImageSrc(brandLogoUrl)}
              />
            </span>
          ) : null}
          <p className="m-0">
            © {year}
            {brandName ? ` ${brandName}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-white/50">
          <Link className="hover:text-white" href="/shop">
            المتجر
          </Link>
          <Link className="hover:text-white" href="/cart">
            السلة
          </Link>
        </div>
      </div>
    </footer>
  );
}
