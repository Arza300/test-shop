import Link from "next/link";
import { CustomStoreSectionsManager } from "@/components/admin/custom-store-sections-manager";

export const dynamic = "force-dynamic";

export default function AdminCustomSectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-cyan-400">
          ← العودة للوحة التحكم
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">إدارة الأقسام المخصصة</h1>
        <p className="mt-1 text-sm text-zinc-500">
          أنشئ أقسام جديدة للمتجر وأضف المنتجات داخل كل قسم، وسيتم عرضها تلقائيا في الصفحة الرئيسية.
        </p>
      </div>

      <CustomStoreSectionsManager />
    </div>
  );
}
