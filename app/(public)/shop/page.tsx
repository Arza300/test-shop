import { Suspense } from "react";
import { PublicPageContainer } from "@/components/public-page-container";
import { ShopContent } from "./shop-content";
import { Skeleton } from "@/components/ui/skeleton";

function ShopFallback() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">المتجر</h1>
        <p className="text-muted-foreground">تصفية حسب السعر، النوع، والمنصة.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <PublicPageContainer>
      <Suspense fallback={<ShopFallback />}>
        <ShopContent />
      </Suspense>
    </PublicPageContainer>
  );
}
