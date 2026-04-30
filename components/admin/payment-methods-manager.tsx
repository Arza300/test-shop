"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type PaymentMethodRow = {
  id: string;
  name: string;
  phoneNumber: string;
  transferProofInstruction: string;
  supportNumber: string | null;
  isActive: boolean;
};

type PaymentMethodDraft = Omit<PaymentMethodRow, "id">;

const queryKey = ["admin-payment-methods"];

function toDraft(row: PaymentMethodRow): PaymentMethodDraft {
  return {
    name: row.name,
    phoneNumber: row.phoneNumber,
    transferProofInstruction: row.transferProofInstruction,
    supportNumber: row.supportNumber,
    isActive: row.isActive,
  };
}

export function PaymentMethodsManager() {
  const qc = useQueryClient();
  const [newDraft, setNewDraft] = useState<PaymentMethodDraft>({
    name: "",
    phoneNumber: "",
    transferProofInstruction: "بعد التحويل، أرسل صورة تأكيد العملية على رقم الواتساب الموضح.",
    supportNumber: null,
    isActive: true,
  });
  const [drafts, setDrafts] = useState<Record<string, PaymentMethodDraft>>({});
  const [expandedMethodIds, setExpandedMethodIds] = useState<Set<string>>(() => new Set());

  const methodsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch("/api/admin/payment-methods");
      const json = (await res.json().catch(() => ({}))) as { items?: PaymentMethodRow[]; error?: string };
      if (!res.ok) throw new Error(json.error || "فشل تحميل طرق الدفع");
      return { items: json.items ?? [] };
    },
  });

  const methods = useMemo(() => methodsQuery.data?.items ?? [], [methodsQuery.data?.items]);
  const initialDrafts = useMemo(() => {
    const next: Record<string, PaymentMethodDraft> = {};
    for (const method of methods) next[method.id] = toDraft(method);
    return next;
  }, [methods]);
  const ensureDraft = (method: PaymentMethodRow) => drafts[method.id] ?? initialDrafts[method.id];
  const toggleMethodExpanded = (id: string) => {
    setExpandedMethodIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const invalidate = () => qc.invalidateQueries({ queryKey });

  const createMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newDraft,
          supportNumber: newDraft.supportNumber || null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "تعذر إضافة طريقة الدفع");
    },
    onSuccess: async () => {
      setNewDraft({
        name: "",
        phoneNumber: "",
        transferProofInstruction: "بعد التحويل، أرسل صورة تأكيد العملية على رقم الواتساب الموضح.",
        supportNumber: null,
        isActive: true,
      });
      await invalidate();
      toast.success("تمت إضافة طريقة الدفع");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const patchMut = useMutation({
    mutationFn: async (payload: { id: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/payment-methods/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "تعذر تحديث طريقة الدفع");
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("تم حفظ التعديل");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/payment-methods/${id}`, { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "تعذر حذف طريقة الدفع");
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("تم حذف طريقة الدفع");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (methodsQuery.isLoading) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/70">
        <CardHeader>
          <CardTitle className="text-zinc-100">طرق الدفع</CardTitle>
          <CardDescription className="text-zinc-500">جاري تحميل طرق الدفع...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-zinc-800 bg-zinc-900/70">
        <CardHeader>
          <CardTitle className="text-zinc-100">إضافة طريقة دفع جديدة</CardTitle>
          <CardDescription className="text-zinc-500">
            أضف بيانات التحويل اليدوي والرقم الذي سيرسل عليه المستخدم صورة تأكيد التحويل.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-zinc-300">اسم طريقة الدفع</Label>
            <Input
              className="mt-1.5 border-zinc-700 bg-zinc-950"
              value={newDraft.name}
              onChange={(e) => setNewDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="مثال: فودافون كاش"
            />
          </div>
          <div>
            <Label className="text-zinc-300">رقم الهاتف/الواتساب</Label>
            <Input
              className="mt-1.5 border-zinc-700 bg-zinc-950"
              value={newDraft.phoneNumber}
              onChange={(e) => setNewDraft((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="01000000000"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-zinc-300">تعليمات إرسال صورة تأكيد التحويل</Label>
            <Textarea
              className="mt-1.5 border-zinc-700 bg-zinc-950"
              rows={4}
              value={newDraft.transferProofInstruction}
              onChange={(e) => setNewDraft((prev) => ({ ...prev, transferProofInstruction: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-zinc-300">رقم الدعم (اختياري)</Label>
            <Input
              className="mt-1.5 border-zinc-700 bg-zinc-950"
              value={newDraft.supportNumber ?? ""}
              onChange={(e) =>
                setNewDraft((prev) => ({ ...prev, supportNumber: e.target.value.trim() ? e.target.value : null }))
              }
              placeholder="رقم بديل للدعم"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant={newDraft.isActive ? "secondary" : "outline"}
              className={
                newDraft.isActive ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"
              }
              onClick={() => setNewDraft((prev) => ({ ...prev, isActive: !prev.isActive }))}
            >
              {newDraft.isActive ? "نشطة" : "غير نشطة"}
            </Button>
          </div>
          <div className="sm:col-span-2">
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={createMut.isPending || !newDraft.name.trim() || !newDraft.phoneNumber.trim()}
              onClick={() => createMut.mutate()}
            >
              إضافة طريقة الدفع
            </Button>
          </div>
        </CardContent>
      </Card>

      {methods.length === 0 ? <p className="text-sm text-zinc-500">لا توجد طرق دفع مضافة بعد.</p> : null}

      {methods.map((method) => {
        const draft = ensureDraft(method);
        const isOpen = expandedMethodIds.has(method.id);
        const isDirty =
          draft.name !== method.name ||
          draft.phoneNumber !== method.phoneNumber ||
          draft.transferProofInstruction !== method.transferProofInstruction ||
          draft.supportNumber !== method.supportNumber ||
          draft.isActive !== method.isActive;

        return (
          <Card key={method.id} className="border-zinc-800 bg-zinc-900/70">
            <CardHeader className="p-0">
              <button
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-6 py-5 text-right transition-colors hover:bg-zinc-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35",
                  isOpen ? "rounded-t-xl" : "rounded-xl"
                )}
                onClick={() => toggleMethodExpanded(method.id)}
                aria-expanded={isOpen}
                aria-controls={`payment-method-panel-${method.id}`}
              >
                <div className="min-w-0">
                  <CardTitle className="text-zinc-100">{method.name}</CardTitle>
                  <CardDescription className="mt-1 text-zinc-500">
                    {draft.isActive ? "نشطة" : "غير نشطة"} • {isOpen ? "إخفاء التفاصيل" : "عرض التفاصيل"}
                  </CardDescription>
                </div>
                <ChevronDown
                  className={cn("h-5 w-5 shrink-0 text-zinc-400 transition-transform", isOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
            </CardHeader>
            {isOpen ? (
            <CardContent id={`payment-method-panel-${method.id}`} className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-zinc-300">اسم طريقة الدفع</Label>
                <Input
                  className="mt-1.5 border-zinc-700 bg-zinc-950"
                  value={draft.name}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [method.id]: { ...draft, name: e.target.value } }))}
                />
              </div>
              <div>
                <Label className="text-zinc-300">رقم الهاتف/الواتساب</Label>
                <Input
                  className="mt-1.5 border-zinc-700 bg-zinc-950"
                  value={draft.phoneNumber}
                  onChange={(e) =>
                    setDrafts((prev) => ({ ...prev, [method.id]: { ...draft, phoneNumber: e.target.value } }))
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-zinc-300">تعليمات إرسال الإثبات</Label>
                <Textarea
                  className="mt-1.5 border-zinc-700 bg-zinc-950"
                  rows={4}
                  value={draft.transferProofInstruction}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [method.id]: { ...draft, transferProofInstruction: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <Label className="text-zinc-300">رقم الدعم (اختياري)</Label>
                <Input
                  className="mt-1.5 border-zinc-700 bg-zinc-950"
                  value={draft.supportNumber ?? ""}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [method.id]: { ...draft, supportNumber: e.target.value.trim() ? e.target.value : null },
                    }))
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant={draft.isActive ? "secondary" : "outline"}
                  className={
                    draft.isActive ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"
                  }
                  onClick={() =>
                    setDrafts((prev) => ({ ...prev, [method.id]: { ...draft, isActive: !draft.isActive } }))
                  }
                >
                  {draft.isActive ? "نشطة" : "غير نشطة"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!isDirty || patchMut.isPending}
                  onClick={() =>
                    patchMut.mutate({
                      id: method.id,
                      body: {
                        name: draft.name,
                        phoneNumber: draft.phoneNumber,
                        transferProofInstruction: draft.transferProofInstruction,
                        supportNumber: draft.supportNumber,
                        isActive: draft.isActive,
                      },
                    })
                  }
                >
                  حفظ التعديلات
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteMut.isPending}
                  onClick={() => deleteMut.mutate(method.id)}
                >
                  حذف
                </Button>
              </div>
            </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
