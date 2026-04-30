 "use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type NavItem = { id: string; title: string };
type StoreNavItem = { href: string; title: string; id: string };

export function StoreNavBar() {
  const [items, setItems] = useState<NavItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    fetch("/api/public/custom-store-sections-nav")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items?: NavItem[] } | null) => {
        if (!alive) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!alive) return;
        setItems([]);
      })
      .finally(() => {
        if (!alive) return;
        setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  if (!isLoading && items.length === 0) return null;
  const navItems: StoreNavItem[] = [
    { id: "all", title: "عرض الكل", href: "/shop/section/all" },
    ...items.map((item) => ({ id: item.id, title: item.title, href: `/shop/section/${item.id}` })),
  ];

  return (
    <>
      <div className="hidden border-t border-white/5 md:block">
        <nav
          className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-start gap-1.5 px-2 py-2.5"
          aria-label="التصنيفات"
        >
          {isLoading ? (
            <span className="font-milligram-arabic-extrabold px-3 text-[15px] text-white/70">تحميل الأقسام...</span>
          ) : (
            navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className="h-9 gap-0.5 rounded-md px-3 text-[15px] font-normal text-white/90 hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href={item.href} className="font-milligram-arabic-extrabold inline-flex items-center">
                  {item.title}
                </Link>
              </Button>
            ))
          )}
        </nav>
      </div>
      <div className="border-t border-white/5 md:hidden">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-2 py-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="font-milligram-arabic-extrabold border-white/20 bg-white/5 text-[15px] text-white"
              >
                <Menu className="ml-1 h-4 w-4" />
                القوائم
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[min(100%,320px)] border-white/10 bg-store-header text-white"
            >
              <p className="mb-3 text-sm font-semibold">الأقسام</p>
              {isLoading ? (
                <p className="font-milligram-arabic-extrabold text-[15px] text-white/70">تحميل الأقسام...</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <Button key={item.id} variant="ghost" className="justify-end text-[15px] text-white" asChild>
                      <Link className="font-milligram-arabic-extrabold" href={item.href}>
                        {item.title}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
