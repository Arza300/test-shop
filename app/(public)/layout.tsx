import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

function HeaderFallback() {
  return <div className="h-20 animate-pulse bg-store-header" aria-hidden />;
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark flex min-h-full flex-col bg-store-bg text-foreground">
      <Suspense fallback={<HeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main className="flex-1 w-full">{children}</main>
      <SiteFooter />
    </div>
  );
}
