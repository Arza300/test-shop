import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-store-header/80">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/50">© {new Date().getFullYear()} NebulaPlay</p>
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
