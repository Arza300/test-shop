import type { Metadata } from "next";
import { brandPrimaryHexToCssProperties } from "@/lib/brand-primary-theme";
import { getStoredBrandPrimaryHex } from "@/lib/site-branding-brand-hex-server";
import { AdminTopBar } from "@/components/admin/admin-top-bar";

export const metadata: Metadata = {
  title: "لوحة الإدارة — NebulaPlay",
  description: "إدارة المنتجات والطلبات والمستخدمين",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const brandHex = await getStoredBrandPrimaryHex();
  const themeStyle = brandPrimaryHexToCssProperties(brandHex);

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100 dark" dir="rtl" style={themeStyle}>
      <AdminTopBar />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
