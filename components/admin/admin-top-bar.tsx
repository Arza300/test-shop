"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { ChevronDown, LayoutDashboard, Store, User } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shouldUnoptimizeImageSrc } from "@/lib/image-url";

export function AdminTopBar() {
  const { data: session, status } = useSession();
  const [brandName, setBrandName] = useState<string | null>(null);
  const [brandLogoUrl, setBrandLogoUrl] = useState<string | null>(null);

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

  const displayName =
    session?.user?.name?.trim() ||
    (session?.user?.email ? session.user.email.split("@")[0] : "مدير");

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/90 bg-zinc-950/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-3 gap-y-3 px-4 py-3 lg:grid-cols-[auto_1fr_auto]">
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5 text-zinc-100">
          {brandLogoUrl ? (
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-zinc-700">
              <Image
                src={brandLogoUrl}
                alt=""
                fill
                className="object-cover"
                sizes="36px"
                unoptimized={shouldUnoptimizeImageSrc(brandLogoUrl)}
              />
            </span>
          ) : null}
          {brandName ? (
            <span className="block truncate text-sm font-bold tracking-tight">{brandName}</span>
          ) : (
            <span className="block truncate text-sm font-bold tracking-tight">المتجر</span>
          )}
        </Link>

        <nav
          className="col-span-2 flex flex-wrap items-center justify-center gap-1 border-t border-zinc-800/70 pt-3 lg:col-span-1 lg:border-t-0 lg:pt-0"
          aria-label="روابط سريعة"
        >
          <Button variant="ghost" size="sm" className="text-zinc-300 hover:bg-zinc-800 hover:text-white" asChild>
            <Link href="/admin" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4 opacity-80" />
              الرئيسية
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="text-zinc-300 hover:bg-zinc-800 hover:text-white" asChild>
            <Link href="/" className="gap-1.5">
              <Store className="h-4 w-4 opacity-80" />
              المتجر
            </Link>
          </Button>
        </nav>

        <div className="flex items-center justify-end gap-1 lg:justify-self-end">
          {status === "loading" ? null : session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1 border-zinc-700 bg-zinc-900/80 text-zinc-100 hover:bg-zinc-800 hover:text-white"
                >
                  <User className="h-4 w-4 opacity-80" />
                  <span className="max-w-[120px] truncate">{displayName}</span>
                  <ChevronDown className="h-4 w-4 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 border-zinc-800 bg-zinc-900 text-zinc-100">
                <DropdownMenuItem asChild className="focus:bg-zinc-800 focus:text-white">
                  <Link href="/profile">الملف والطلبات</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-400 focus:bg-zinc-800 focus:text-red-300"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </header>
  );
}
