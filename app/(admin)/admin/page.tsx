import Link from "next/link";
import { AdminDashboardCard } from "@/components/admin/admin-dashboard-card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PillItem =
  | { href: string; label: string }
  | { soon: true; label: string };

const pills: PillItem[] = [
  { href: "/admin/incoming-orders", label: "الطلبات الواردة" },
  { href: "/admin/users", label: "المستخدمون والحسابات" },
  { href: "/admin/brands", label: "العلامات التجارية" },
  { href: "/admin/sections-order", label: "ترتيب الأقسام" },
  { href: "/admin/custom-sections", label: "الأقسام المخصصة" },
  { href: "/admin/design/home", label: "إعدادات الصفحة الرئيسية" },
  { href: "/admin/payment-methods", label: "طرق الدفع" },
];

function Pill({ item }: { item: PillItem }) {
  const base =
    "inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors";
  if ("soon" in item && item.soon) {
    return (
      <span
        className={cn(
          base,
          "cursor-not-allowed border-zinc-800/90 bg-zinc-900/40 text-zinc-600"
        )}
      >
        {item.label}
      </span>
    );
  }
  const { href, label } = item as { href: string; label: string };
  return (
    <Link
      href={href}
      className={cn(
        base,
        "border-zinc-700/90 bg-zinc-900/80 text-zinc-200 hover:border-cyan-500/35 hover:bg-zinc-800 hover:text-white"
      )}
    >
      {label}
    </Link>
  );
}

export default function AdminHomePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-zinc-500">اختصارات لأهم أقسام الإدارة — المزيد يُضاف لاحقاً.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {pills.map((item) => (
            <Pill key={"href" in item ? item.href : item.label} item={item} />
          ))}
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold text-white sm:text-xl">اداره المتجر</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminDashboardCard
            href="/admin/incoming-orders"
            title="الطلبات الواردة"
            description="عرض كل طلبات المستخدمين مع بيانات العميل وتفاصيل القسم والمنتج."
          />
          <AdminDashboardCard
            href="/admin/design/home"
            title="إعدادات الصفحة الرئيسية"
            description="صور السلايدر والنصوص الاختيارية في أعلى الصفحة الرئيسية للمتجر."
          />
          <AdminDashboardCard
            href="/admin/custom-sections"
            title="الأقسام المخصصة"
            description="إنشاء أقسام جديدة للمتجر وإضافة منتجات كل قسم بنفس شكل بطاقات العرض."
          />
          <AdminDashboardCard
            href="/admin/sections-order"
            title="ترتيب الأقسام"
            description="تغيير ترتيب ظهور أقسام الصفحة الرئيسية تحت السلايدر."
          />
          <AdminDashboardCard
            href="/admin/brands"
            title="العلامات التجارية"
            description="إدارة البراندات الظاهرة في واجهة المتجر وتعديل ترتيبها وشعاراتها."
          />
          <AdminDashboardCard
            href="/admin/payment-methods"
            title="طرق الدفع"
            description="إضافة وتعديل طرق الدفع اليدوية ورقم الواتساب/الهاتف الذي يستقبل صورة تأكيد التحويل."
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold text-white sm:text-xl">إدارة المستخدمين</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminDashboardCard
            href="/admin/users"
            title="المستخدمون والحسابات"
            description="عرض الحسابات، البريد، وتاريخ الانضمام."
          />
        </div>
      </section>
    </div>
  );
}
