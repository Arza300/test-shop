import { Suspense } from "react";
import { brandPrimaryHexToCssProperties } from "@/lib/brand-primary-theme";
import { getPublicSiteBranding } from "@/lib/site-branding-brand-hex-server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

function HeaderFallback() {
  return <div className="h-20 animate-pulse bg-store-header" aria-hidden />;
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const branding = await getPublicSiteBranding();
  const themeStyle = brandPrimaryHexToCssProperties(branding.brandPrimaryHex);

  return (
    <div className="dark flex min-h-full flex-col bg-store-bg text-foreground" style={themeStyle}>
      <Suspense fallback={<HeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main className="flex-1 w-full">{children}</main>
      <SiteFooter brandName={branding.name} brandLogoUrl={branding.logoUrl} />
    </div>
  );
}
