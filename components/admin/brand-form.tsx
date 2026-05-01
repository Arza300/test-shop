"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { brandCreateSchema, type BrandCreateInput } from "@/lib/validations/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type BrandDetail = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  isVisible: boolean;
  position: number;
  linkedSectionId: string | null;
};

const NO_SECTION_VALUE = "__none__";

type SectionOption = { id: string; title: string };

export function BrandDelete({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Card className="border-red-900/50 bg-red-950/20">
      <CardHeader>
        <CardTitle className="text-base text-red-200">حذف العلامة</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="destructive"
          disabled={busy}
          onClick={async () => {
            if (!confirm("حذف هذه العلامة نهائياً؟")) return;
            setBusy(true);
            try {
              const r = await fetch(`/api/admin/brands/${id}`, { method: "DELETE" });
              if (!r.ok) {
                const j = await r.json().catch(() => ({}));
                throw new Error((j as { error?: string }).error || "فشل الحذف");
              }
              toast.success("تم الحذف");
              router.push("/admin/brands");
              router.refresh();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "فشل الحذف");
            } finally {
              setBusy(false);
            }
          }}
        >
          حذف
        </Button>
      </CardContent>
    </Card>
  );
}

export function BrandForm({
  brandId,
  initial,
}: {
  brandId?: string;
  initial?: Partial<BrandCreateInput>;
}) {
  const router = useRouter();
  const [fileUploading, setFileUploading] = useState(false);

  const { data: sectionsPayload, isLoading: sectionsLoading } = useQuery({
    queryKey: ["admin-custom-sections", "brand-form"],
    queryFn: async () => {
      const r = await fetch("/api/admin/custom-store-sections");
      if (!r.ok) return { items: [] as SectionOption[] };
      const j = (await r.json()) as { items?: Array<{ id: string; title: string }> };
      return {
        items: (j.items ?? []).map((s) => ({ id: s.id, title: s.title })),
      };
    },
  });
  const sectionOptions = sectionsPayload?.items ?? [];

  const {
    data: brandRow,
    isLoading: brandLoading,
    isError: brandError,
  } = useQuery({
    queryKey: ["admin-brand", brandId],
    queryFn: async () => {
      const r = await fetch(`/api/admin/brands/${brandId}`);
      if (!r.ok) throw new Error("غير موجود");
      return r.json() as Promise<BrandDetail>;
    },
    enabled: !!brandId,
  });

  const form = useForm<BrandCreateInput>({
    resolver: zodResolver(brandCreateSchema),
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      logoUrl: initial?.logoUrl ?? "/placeholder.svg",
      isVisible: initial?.isVisible ?? true,
      position: initial?.position ?? 0,
      linkedSectionId: initial?.linkedSectionId ?? null,
    },
  });

  useEffect(() => {
    if (!brandRow) return;
    form.reset({
      name: brandRow.name,
      slug: brandRow.slug,
      logoUrl: brandRow.logoUrl,
      isVisible: brandRow.isVisible,
      position: brandRow.position,
      linkedSectionId: brandRow.linkedSectionId ?? null,
    });
  }, [brandRow, form]);

  const upload = async (file: File) => {
    setFileUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: fd });
    setFileUploading(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error((payload as { error?: string }).error || "فشل الرفع");
    }
    const payload = (await response.json()) as { url: string };
    return payload.url;
  };

  if (brandId && brandLoading) return <Skeleton className="h-96 w-full" />;
  if (brandId && brandError) return <p className="text-destructive">العلامة غير موجودة.</p>;

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(async (values) => {
        const response = await fetch(
          brandId ? `/api/admin/brands/${brandId}` : "/api/admin/brands",
          {
            method: brandId ? "PATCH" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          }
        );
        if (!response.ok) {
          const j = await response.json().catch(() => ({}));
          toast.error((j as { error?: string }).error || "فشل الحفظ");
          return;
        }
        toast.success("تم الحفظ");
        router.push("/admin/brands");
        router.refresh();
      })}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>اسم العلامة</Label>
          <Input className="mt-1" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div>
          <Label>المسار (إنجليزي للرابط)</Label>
          <Input className="mt-1" dir="ltr" {...form.register("slug")} placeholder="ubisoft" />
          {form.formState.errors.slug && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.slug.message}</p>
          )}
        </div>
        <div>
          <Label>الترتيب</Label>
          <Input className="mt-1" type="number" {...form.register("position", { valueAsNumber: true })} />
        </div>
        <div>
          <Label>الظهور في الصفحة الرئيسية</Label>
          <Select
            value={form.watch("isVisible") ? "yes" : "no"}
            onValueChange={(v) => form.setValue("isVisible", v === "yes")}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">ظاهر</SelectItem>
              <SelectItem value="no">مخفي</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>القسم المرتبط (يفتح عند النقر على الشعار في الصفحة الرئيسية)</Label>
          {sectionsLoading ? (
            <Skeleton className="mt-1 h-10 w-full" />
          ) : (
            <Select
              value={form.watch("linkedSectionId") ?? NO_SECTION_VALUE}
              onValueChange={(v) =>
                form.setValue("linkedSectionId", v === NO_SECTION_VALUE ? null : v, { shouldDirty: true })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="اختر قسماً" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_SECTION_VALUE}>بدون قسم (كل المنتجات)</SelectItem>
                {sectionOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="sm:col-span-2">
          <Label>رابط شعار اللوجو</Label>
          <Input className="mt-1" dir="ltr" {...form.register("logoUrl")} />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const url = await upload(file);
                  form.setValue("logoUrl", url);
                  toast.success("تم الرفع");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "فشل الرفع");
                }
                e.target.value = "";
              }}
            />
            {fileUploading ? <span className="text-xs text-muted-foreground">جاري الرفع…</span> : null}
          </div>
          {form.formState.errors.logoUrl && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.logoUrl.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit">حفظ</Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/brands">إلغاء</Link>
        </Button>
      </div>
    </form>
  );
}
