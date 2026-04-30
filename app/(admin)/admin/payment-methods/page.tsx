import Link from "next/link";
import { PaymentMethodsManager } from "@/components/admin/payment-methods-manager";

export const dynamic = "force-dynamic";

export default function AdminPaymentMethodsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-cyan-400">
          ← العودة للوحة التحكم
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">طرق الدفع</h1>
        <p className="mt-1 text-sm text-zinc-500">
          إدارة طرق الدفع اليدوية التي ستظهر للمستخدم قبل تأكيد الطلب.
        </p>
      </div>
      <PaymentMethodsManager />
    </div>
  );
}
