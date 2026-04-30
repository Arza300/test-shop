"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Role } from "@prisma/client";
import { userRoleLabelAr } from "@/lib/product-labels";
import { toast } from "sonner";

type AdminUserRow = { id: string; name: string; email: string; role: Role; createdAt: string };

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<Role>(Role.USER);
  const [editPassword, setEditPassword] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const r = await fetch("/api/admin/users");
      if (!r.ok) throw new Error("فشل التحميل");
      return r.json() as Promise<{
        items: AdminUserRow[];
        needsMigration?: boolean;
        message?: string;
      }>;
    },
  });

  const updateUserMut = useMutation({
    mutationFn: async (payload: { userId: string; name: string; email: string; role: Role; password?: string }) => {
      const r = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error || "تعذر تحديث الحساب");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("تم تحديث بيانات الحساب");
      setEditingUser(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data?.items ?? [];
  const query = search.trim().toLowerCase();
  const filteredRows = query
    ? rows.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(query))
    : rows;

  const openEditDialog = (user: AdminUserRow) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditRole(user.role === Role.ADMIN ? Role.ADMIN : Role.USER);
    setEditPassword("");
  };

  const submitEdit = async () => {
    if (!editingUser) return;
    await updateUserMut.mutateAsync({
      userId: editingUser.id,
      name: editName.trim(),
      email: editEmail.trim(),
      role: editRole,
      ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
    });
  };

  if (isLoading) return <Skeleton className="h-64" />;
  if (isError) return <p className="text-destructive">رفض الوصول.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">المستخدمون</h1>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو البريد..."
          className="max-w-md"
        />
        <span className="text-xs text-zinc-500">
          {filteredRows.length} / {rows.length}
        </span>
      </div>
      {data?.needsMigration ? (
        <p className="text-sm text-amber-400">{data.message ?? "جدول المستخدمين غير متاح حاليًا."}</p>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>الاسم</TableHead>
            <TableHead>البريد</TableHead>
            <TableHead>الصلاحية</TableHead>
            <TableHead>تاريخ الانضمام</TableHead>
            <TableHead>إجراء</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRows.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.name}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
                  {u.role === "ADMIN" ? "مدير" : "مستخدم"}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(u.createdAt).toLocaleString("ar-EG")}
              </TableCell>
              <TableCell>
                <Button type="button" size="sm" variant="outline" onClick={() => openEditDialog(u)}>
                  تعديل
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل بيانات الحساب</DialogTitle>
            <DialogDescription>يمكنك تعديل الاسم، البريد، والرتبة للحساب المحدد.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm text-zinc-300">الاسم</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-300">البريد الإلكتروني</label>
              <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} dir="ltr" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-300">الرتبة</label>
              <select
                className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm outline-none focus:border-cyan-600"
                value={editRole}
                onChange={(e) => setEditRole(e.target.value === Role.ADMIN ? Role.ADMIN : Role.USER)}
              >
                <option value={Role.USER}>{userRoleLabelAr(Role.USER)}</option>
                <option value={Role.ADMIN}>{userRoleLabelAr(Role.ADMIN)}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-300">كلمة مرور جديدة (اختياري)</label>
              <Input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="اتركه فارغًا إذا لا تريد التغيير"
                dir="ltr"
              />
              <p className="mt-1 text-xs text-zinc-500">الحد الأدنى 8 أحرف.</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setEditingUser(null)}>
              إلغاء
            </Button>
            <Button type="button" disabled={updateUserMut.isPending} onClick={submitEdit}>
              {updateUserMut.isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
