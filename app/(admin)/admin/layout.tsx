import type { Metadata } from "next";
import { AdminTopBar } from "@/components/admin/admin-top-bar";

export const metadata: Metadata = {
  title: "لوحة الإدارة — NebulaPlay",
  description: "إدارة المنتجات والطلبات والمستخدمين",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100 dark" dir="rtl">
      <AdminTopBar />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
