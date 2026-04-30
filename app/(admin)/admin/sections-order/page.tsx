import Link from "next/link";
import { HomeSectionsOrderCard } from "@/components/admin/home-sections-order-card";

export default function AdminSectionsOrderPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-cyan-400">
          ← العودة للوحة التحكم
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">ترتيب الأقسام</h1>
        <p className="mt-1 text-sm text-zinc-500">تحكم في ترتيب ظهور أقسام الصفحة الرئيسية أسفل السلايدر.</p>
      </div>

      <HomeSectionsOrderCard />
    </div>
  );
}
