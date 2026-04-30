"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Search, ShoppingCart, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCartStore } from "@/lib/cart-store";
import { Input } from "@/components/ui/input";
import { StoreTopBar } from "@/components/store-top-bar";
import { StoreNavBar } from "@/components/store-nav-bar";
import Image from "next/image";
import { shouldUnoptimizeImageSrc } from "@/lib/image-url";
import { SearchCat } from "@/components/shop/search-cat";

export function SiteHeader() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const count = useCartStore((s) => s.items.reduce((a, b) => a + b.quantity, 0));
  const [q, setQ] = useState("");
  const [catAwake, setCatAwake] = useState(false);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    let alive = true;
    fetch("/api/public/site-branding")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { name?: string | null; logoUrl?: string | null } | null) => {
        if (!alive || !d) return;
        setBrandName(d.name ?? null);
        setBrandLogoUrl(d.logoUrl ?? null);
      })
      .catch(() => {
        if (!alive) return;
        setBrandName(null);
        setBrandLogoUrl(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full">
      <StoreTopBar />
      <div className="bg-store-header shadow-lg shadow-black/20">
        <div className="mx-auto max-w-[1400px] px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            <Link href="/" className="flex shrink-0 items-center justify-center gap-2 sm:justify-start">
              {brandLogoUrl ? (
                <span className="relative h-12 w-12 overflow-hidden rounded-full shadow-md">
                  <Image
                    src={brandLogoUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized={shouldUnoptimizeImageSrc(brandLogoUrl)}
                  />
                </span>
              ) : null}
              {brandName ? (
                <span className="text-xl font-bold tracking-tight text-white">{brandName}</span>
              ) : null}
            </Link>

            <form
              className="flex w-full min-w-0 flex-1 items-center gap-2"
              onMouseEnter={() => setCatAwake(true)}
              onMouseLeave={() => setCatAwake(false)}
              onSubmit={(e) => {
                e.preventDefault();
                const t = q.trim().replace(/\s+/g, " ");
                if (t) router.push(`/shop?q=${encodeURIComponent(t)}`);
                else router.push("/shop");
              }}
            >
              <div className="relative flex-1">
                <SearchCat awake={catAwake} />
                <Input
                  type="search"
                  name="q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => setCatAwake(true)}
                  onBlur={() => setCatAwake(false)}
                  placeholder="ابحث عن منتج أو قسم..."
                  className="h-11 rounded-full border-slate-600/80 bg-slate-100 pe-16 ps-10 text-slate-900 shadow-inner placeholder:text-slate-500"
                />
                <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
              <Button
                type="submit"
                className="h-11 shrink-0 rounded-full bg-store-link px-5 font-semibold text-white hover:bg-store-link/90"
              >
                <span className="font-milligram-arabic">بحث</span>
              </Button>
            </form>

            <div className="flex items-center justify-center gap-1 sm:justify-end sm:gap-2">
              <p className="hidden text-sm text-white/60 lg:inline">
                اللغة: <span className="text-white">العربية</span>
              </p>
              {status === "loading" ? null : session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="gap-1.5 text-white hover:bg-white/10 hover:text-white"
                    >
                      <User className="h-5 w-5" />
                      <span className="hidden sm:inline">حسابي</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">الطلبات والملف</Link>
                    </DropdownMenuItem>
                    {session.user.role === "ADMIN" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">لوحة التحكم</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="text-destructive"
                    >
                      تسجيل خروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-1.5 text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link href="/auth/sign-in">
                    <User className="h-5 w-5" />
                    <span className="text-sm">تسجيل الدخول</span>
                  </Link>
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/cart" aria-label="سلة المشتريات">
                  <ShoppingCart className="h-5 w-5" />
                  {count > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-900">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <StoreNavBar />
      </div>
    </header>
  );
}
