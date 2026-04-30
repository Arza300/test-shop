"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { orderStatusLabelAr, userRoleLabelAr } from "@/lib/product-labels";
import { toast } from "sonner";

export default function ProfilePage() {
  const qc = useQueryClient();
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [orderQuery, setOrderQuery] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const r = await fetch("/api/orders");
      if (!r.ok) throw new Error("فشل التحميل");
      return r.json() as Promise<{
        items: {
          id: string;
          status: string;
          total: string;
          createdAt: string;
          items: { id: string; title: string; quantity: number; product: { title: string; slug: string } | null }[];
        }[];
      }>;
    },
    enabled: status === "authenticated",
  });

  const updateProfileMut = useMutation({
    mutationFn: async (payload: { name?: string; password?: string }) => {
      const r = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error || "تعذر تحديث الحساب");
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["session"] });
      toast.success("تم تحديث بيانات الحساب");
      setPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (!session) {
    return (
      <p>
        <Link className="text-primary underline" href="/auth/sign-in">
          سجّل الدخول
        </Link>{" "}
        لعرض حسابك.
      </p>
    );
  }

  const effectiveName = name || session.user.name || "";
  const orders = data?.items ?? [];
  const q = orderQuery.trim().toLowerCase();
  const filteredOrders = q
    ? orders.filter((o) => {
        const orderText = `${o.id} ${orderStatusLabelAr(o.status)} ${o.total} ${new Date(o.createdAt).toLocaleString(
          "ar-EG"
        )}`.toLowerCase();
        const itemsText = o.items.map((i) => i.title).join(" ").toLowerCase();
        return orderText.includes(q) || itemsText.includes(q);
      })
    : orders;

  const saveProfile = async () => {
    const payload: { name?: string; password?: string } = {};
    const trimmedName = effectiveName.trim();
    if (trimmedName && trimmedName !== (session.user.name ?? "")) payload.name = trimmedName;
    const trimmedPassword = password.trim();
    if (trimmedPassword) payload.password = trimmedPassword;
    if (!payload.name && !payload.password) {
      toast.info("لا يوجد تعديل للحفظ");
      return;
    }
    await updateProfileMut.mutateAsync(payload);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">حسابي</h1>
      <Card>
        <CardHeader>
          <CardTitle>الملف الشخصي</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <div className="space-y-3">
            <div>
              <span className="mb-1 block font-medium text-foreground">الاسم</span>
              <Input value={effectiveName} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <span className="mb-1 block font-medium text-foreground">كلمة المرور الجديدة (اختياري)</span>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="اتركها فارغة إذا لا تريد تغييرها"
              />
            </div>
          </div>
          <p>
            <span className="font-medium text-foreground">البريد:</span> {session.user.email}
          </p>
          <p>
            <span className="font-medium text-foreground">الصلاحية:</span> {userRoleLabelAr(session.user.role)}
          </p>
          <div className="pt-2">
            <Button type="button" onClick={saveProfile} disabled={updateProfileMut.isPending}>
              {updateProfileMut.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>طلباتي</CardTitle>
          <Button asChild variant="secondary" size="sm">
            <Link href="/shop">تسوق مرة أخرى</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center gap-2">
            <Input
              value={orderQuery}
              onChange={(e) => setOrderQuery(e.target.value)}
              placeholder="ابحث في طلباتك (رقم الطلب، الحالة، المنتج)..."
              className="max-w-md"
            />
            <span className="text-xs text-muted-foreground">
              {filteredOrders.length} / {orders.length}
            </span>
          </div>
          {!orders.length && <p className="text-sm text-muted-foreground">لا طلبات بعد.</p>}
          {!!orders.length && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المعرّف</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="max-w-[120px] truncate font-mono text-xs">{o.id}</TableCell>
                    <TableCell>
                      <Badge className="border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                        {orderStatusLabelAr(o.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-figures text-base font-semibold tabular-nums">${o.total}</TableCell>
                    <TableCell className="text-sm">{new Date(o.createdAt).toLocaleString("ar-EG")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
