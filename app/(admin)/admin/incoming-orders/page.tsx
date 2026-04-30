"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { orderStatusLabelAr } from "@/lib/product-labels";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type IncomingOrder = {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  user: { email: string; name: string } | null;
  items: {
    id: string;
    itemType: string;
    itemId: string;
    sectionTitle: string | null;
    title: string;
    quantity: number;
    unitPrice: string;
  }[];
};

export default function AdminIncomingOrdersPage() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-incoming-orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      const json = (await res.json().catch(() => ({}))) as { items?: IncomingOrder[]; error?: string };
      if (!res.ok) throw new Error(json.error || "فشل تحميل الطلبات");
      return json.items ?? [];
    },
  });
  const updateStatusMut = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: "COMPLETED" | "PENDING" }) => {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "تعذّر تحديث حالة الطلب");
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-incoming-orders"] });
      toast.success("تم تحديث حالة الطلب");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const orders = data ?? [];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOrders = useMemo(() => {
    if (!normalizedQuery) return orders;
    return orders.filter((order) => {
      const orderText = [
        order.id,
        orderStatusLabelAr(order.status),
        order.total,
        new Date(order.createdAt).toLocaleString("ar-EG"),
        order.user?.name ?? "",
        order.user?.email ?? "",
      ]
        .join(" ")
        .toLowerCase();
      const itemsText = order.items
        .map((item) => `${item.title} ${item.sectionTitle ?? ""} ${item.itemType} ${item.quantity} ${item.unitPrice}`)
        .join(" ")
        .toLowerCase();
      return orderText.includes(normalizedQuery) || itemsText.includes(normalizedQuery);
    });
  }, [orders, normalizedQuery]);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-zinc-400 hover:text-cyan-300">
          ← العودة للوحة التحكم
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">الطلبات الواردة</h1>
        <p className="mt-2 text-base text-zinc-400">كل الطلبات الواردة مع تفاصيل العميل، القسم، والمنتجات.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث برقم الطلب، بيانات المستخدم، القسم، المنتج، الحالة، الإجمالي، التاريخ..."
          className="max-w-2xl border-zinc-700 bg-zinc-900/80 text-base text-zinc-100 placeholder:text-zinc-500"
        />
        <span className="text-sm font-medium text-zinc-400">
          {filteredOrders.length} / {orders.length}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 bg-zinc-900" />
          <Skeleton className="h-28 bg-zinc-900" />
        </div>
      ) : null}

      {!isLoading && !orders.length ? <p className="text-sm text-zinc-500">لا توجد طلبات حالياً.</p> : null}

      {!isLoading && !!orders.length ? (
        <div className="space-y-5">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="border-zinc-700/70 bg-zinc-900/55 shadow-md shadow-black/30">
              <CardHeader className="space-y-3">
                <CardTitle className="text-xl font-bold text-zinc-100">
                  طلب <span className="font-mono text-sm text-zinc-300">{order.id}</span>
                </CardTitle>
                <div className="flex flex-wrap items-center gap-3 text-base text-zinc-300">
                  <span>العميل: {order.user?.name || "—"}</span>
                  <span>البريد: {order.user?.email || "—"}</span>
                  <span>الإجمالي: ${order.total}</span>
                  <span>التاريخ: {new Date(order.createdAt).toLocaleString("ar-EG")}</span>
                  <Badge className="border border-zinc-600 bg-zinc-800 px-3 py-1 text-sm text-zinc-100">
                    {orderStatusLabelAr(order.status)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    className="text-sm"
                    disabled={updateStatusMut.isPending}
                    onClick={() => updateStatusMut.mutate({ orderId: order.id, status: "COMPLETED" })}
                  >
                    تم اكتمال الطلب
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="text-sm"
                    disabled={updateStatusMut.isPending}
                    onClick={() => updateStatusMut.mutate({ orderId: order.id, status: "PENDING" })}
                  >
                    تم تعليق الطلب
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-zinc-800/80 bg-zinc-950/80 p-4 text-base">
                      <p className="font-semibold text-zinc-100">{item.title}</p>
                      <p className="mt-1 text-zinc-400">
                        القسم: {item.sectionTitle || "غير محدد"} | النوع: {item.itemType} | الكمية: {item.quantity} |
                        السعر: ${item.unitPrice}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
