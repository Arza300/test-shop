"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { resolveImageUrlForClient, shouldUnoptimizeImageSrc } from "@/lib/image-url";

type SlideRow = {
  id: string;
  imageUrl: string;
  position: number;
  headline: string | null;
  subline: string | null;
  linkedProductId: string | null;
};

type LinkableProductOption = {
  id: string;
  label: string;
  sectionTitle: string;
};

type LinkableSectionOption = {
  id: string;
  title: string;
};

type ProductComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  options: LinkableProductOption[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
};

function ProductCombobox({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.id === value) ?? null;
  const q = query.trim().toLowerCase();
  const filtered = q
    ? options.filter((option) => `${option.label} ${option.sectionTitle}`.toLowerCase().includes(q))
    : options;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full justify-between border-zinc-700 bg-zinc-950 px-3 text-sm font-normal text-zinc-100"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="truncate text-right">
          {selected ? `${selected.sectionTitle} — ${selected.label}` : placeholder}
        </span>
        <span className="text-xs text-zinc-500">▼</span>
      </Button>
      {open ? (
        <div className="absolute z-30 mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 shadow-xl">
          <Input
            autoFocus
            className="h-9 border-zinc-700 bg-zinc-900 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="اكتب اسم المنتج..."
          />
          <div className="mt-2 max-h-52 overflow-y-auto rounded border border-zinc-800">
            <button
              type="button"
              className="w-full border-b border-zinc-800 px-3 py-2 text-right text-xs text-zinc-300 hover:bg-zinc-800/70"
              onClick={() => {
                onChange("");
                setOpen(false);
                setQuery("");
              }}
            >
              بدون ربط
            </button>
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-zinc-500">لا توجد نتائج مطابقة.</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className="w-full border-b border-zinc-800 px-3 py-2 text-right text-xs text-zinc-200 last:border-b-0 hover:bg-zinc-800/70"
                  onClick={() => {
                    onChange(option.id);
                    setOpen(false);
                    setQuery("");
                  }}
                >
                  {option.sectionTitle} — {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const queryKey = ["admin-home-hero-slides"];

export default function AdminHomeHeroDesignPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const sideFileRef = useRef<HTMLInputElement>(null);
  const [headline, setHeadline] = useState("");
  const [subline, setSubline] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sideUploading, setSideUploading] = useState(false);
  const [brandingName, setBrandingName] = useState("");
  const [brandingLogoUrl, setBrandingLogoUrl] = useState<string | null>(null);
  const [brandingTopStripImageUrl, setBrandingTopStripImageUrl] = useState<string | null>(null);
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [pendingSlideImageUrl, setPendingSlideImageUrl] = useState<string | null>(null);
  const [selectedLinkedProductId, setSelectedLinkedProductId] = useState("");
  const [slideLinkDrafts, setSlideLinkDrafts] = useState<Record<string, string>>({});
  const [sideLinkTarget, setSideLinkTarget] = useState<"none" | "section" | "product">("none");
  const [sideLinkedProductId, setSideLinkedProductId] = useState("");
  const [sideLinkedSectionId, setSideLinkedSectionId] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const r = await fetch("/api/admin/home-hero-slides");
      if (!r.ok) throw new Error("فشل التحميل");
      return r.json() as Promise<{ items: SlideRow[] }>;
    },
  });

  const sidePanelQueryKey = ["admin-home-hero-side-panel"];
  const sidePanel = useQuery({
    queryKey: sidePanelQueryKey,
    queryFn: async () => {
      const r = await fetch("/api/admin/home-hero-side-panel");
      if (!r.ok) throw new Error("فشل تحميل صورة البطاقة الجانبية");
      return r.json() as Promise<{
        imageUrl: string | null;
        linkedProductId: string | null;
        linkedSectionId: string | null;
      }>;
    },
  });

  const brandingQueryKey = ["admin-site-branding"];
  const branding = useQuery({
    queryKey: brandingQueryKey,
    queryFn: async () => {
      const r = await fetch("/api/admin/site-branding");
      if (!r.ok) throw new Error("فشل تحميل بيانات اسم الموقع واللوجو");
      return r.json() as Promise<{ name: string | null; logoUrl: string | null; topStripImageUrl: string | null }>;
    },
  });

  const linkableProductsQueryKey = ["admin-linkable-custom-store-products"];
  const linkableProducts = useQuery({
    queryKey: linkableProductsQueryKey,
    queryFn: async () => {
      const r = await fetch("/api/admin/custom-store-sections");
      if (!r.ok) throw new Error("فشل تحميل المنتجات القابلة للربط");
      const data = (await r.json()) as {
        items: Array<{
          id: string;
          title: string;
          isVisible: boolean;
          items: Array<{
            id: string;
            title: string;
            isActive: boolean;
          }>;
        }>;
      };
      const options: LinkableProductOption[] = [];
      for (const section of data.items ?? []) {
        if (!section.isVisible) continue;
        for (const item of section.items ?? []) {
          if (!item.isActive) continue;
          options.push({
            id: item.id,
            label: item.title,
            sectionTitle: section.title,
          });
        }
      }
      return options;
    },
  });

  const linkableSectionsQueryKey = ["admin-linkable-custom-store-sections"];
  const linkableSections = useQuery({
    queryKey: linkableSectionsQueryKey,
    queryFn: async () => {
      const r = await fetch("/api/admin/custom-store-sections");
      if (!r.ok) throw new Error("فشل تحميل الأقسام القابلة للربط");
      const data = (await r.json()) as {
        items: Array<{
          id: string;
          title: string;
          isVisible: boolean;
          items: Array<{ id: string; isActive: boolean }>;
        }>;
      };
      const options: LinkableSectionOption[] = [];
      for (const section of data.items ?? []) {
        if (!section.isVisible) continue;
        if (!(section.items ?? []).some((item) => item.isActive)) continue;
        options.push({ id: section.id, title: section.title });
      }
      return options;
    },
  });

  useEffect(() => {
    if (!sidePanel.data) return;
    const productId = sidePanel.data.linkedProductId ?? "";
    const sectionId = sidePanel.data.linkedSectionId ?? "";
    setSideLinkedProductId((prev) => (prev === productId ? prev : productId));
    setSideLinkedSectionId((prev) => (prev === sectionId ? prev : sectionId));
    setSideLinkTarget((prev) => {
      const next = productId ? "product" : sectionId ? "section" : "none";
      return prev === next ? prev : next;
    });
  }, [sidePanel.data]);

  useEffect(() => {
    if (!branding.data) return;
    const nextName = branding.data.name ?? "";
    const nextLogo = branding.data.logoUrl ?? null;
    const nextTopStrip = branding.data.topStripImageUrl ?? null;
    setBrandingName((prev) => (prev === nextName ? prev : nextName));
    setBrandingLogoUrl((prev) => (prev === nextLogo ? prev : nextLogo));
    setBrandingTopStripImageUrl((prev) => (prev === nextTopStrip ? prev : nextTopStrip));
  }, [branding.data]);

  const addMut = useMutation({
    mutationFn: async (payload: { imageUrl: string; headline?: string; subline?: string; linkedProductId?: string }) => {
      const r = await fetch("/api/admin/home-hero-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || "فشل الإضافة");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setHeadline("");
      setSubline("");
      setSelectedLinkedProductId("");
      setPendingSlideImageUrl(null);
      toast.success("تمت إضافة الشريحة");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/home-hero-slides/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("فشل الحذف");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("تم الحذف");
    },
    onError: () => toast.error("تعذّر الحذف"),
  });

  const moveMut = useMutation({
    mutationFn: async (payload: { id: string; move: "up" | "down" }) => {
      const r = await fetch(`/api/admin/home-hero-slides/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ move: payload.move }),
      });
      if (!r.ok) throw new Error("فشل الترتيب");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
    },
    onError: () => toast.error("تعذّر تغيير الترتيب"),
  });

  const updateSlideLinkMut = useMutation({
    mutationFn: async (payload: { id: string; linkedProductId: string | null }) => {
      const r = await fetch(`/api/admin/home-hero-slides/${payload.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedProductId: payload.linkedProductId }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error || "فشل حفظ الربط");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      toast.success("تم حفظ ربط المنتج");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!r.ok) throw new Error(j.error || "فشل الرفع");
      if (!j.url) throw new Error("لا يوجد رابط للصورة");
      setPendingSlideImageUrl(j.url);
      toast.success("تم رفع الصورة، اضغط «إضافة للسلايدر» لإتمام الإضافة");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل الرفع");
    } finally {
      setUploading(false);
    }
  };

  const addPendingSlide = async () => {
    if (!pendingSlideImageUrl) {
      toast.error("ارفع صورة أولاً");
      return;
    }
    await addMut.mutateAsync({
      imageUrl: pendingSlideImageUrl,
      headline: headline.trim() || undefined,
      subline: subline.trim() || undefined,
      linkedProductId: selectedLinkedProductId || undefined,
    });
  };

  const onPickSideFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSideUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadJson = (await uploadRes.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!uploadRes.ok) throw new Error(uploadJson.error || "فشل رفع الصورة الجانبية");
      if (!uploadJson.url) throw new Error("لا يوجد رابط للصورة");

      const setRes = await fetch("/api/admin/home-hero-side-panel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadJson.url }),
      });
      const setJson = (await setRes.json().catch(() => ({}))) as { error?: string };
      if (!setRes.ok) throw new Error(setJson.error || "فشل حفظ الصورة الجانبية");
      await sidePanel.refetch();
      toast.success("تم تحديث صورة البطاقة الجانبية");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل العملية");
    } finally {
      setSideUploading(false);
    }
  };

  const removeSidePanelImage = async () => {
    setSideUploading(true);
    try {
      const res = await fetch("/api/admin/home-hero-side-panel", { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "فشل حذف الصورة");
      await sidePanel.refetch();
      toast.success("تم حذف صورة البطاقة الجانبية");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل العملية");
    } finally {
      setSideUploading(false);
    }
  };

  const saveSidePanelLink = async () => {
    setSideUploading(true);
    try {
      const payload: { linkedProductId?: string | null; linkedSectionId?: string | null } = {};
      if (sideLinkTarget === "none") {
        payload.linkedProductId = null;
      } else if (sideLinkTarget === "product") {
        payload.linkedProductId = sideLinkedProductId || null;
      } else {
        payload.linkedSectionId = sideLinkedSectionId || null;
      }
      const res = await fetch("/api/admin/home-hero-side-panel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "فشل حفظ ربط البطاقة الجانبية");
      await sidePanel.refetch();
      toast.success("تم حفظ الربط للبطاقة الجانبية");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل العملية");
    } finally {
      setSideUploading(false);
    }
  };

  const saveBrandingIdentity = async () => {
    setBrandingLoading(true);
    try {
      const r = await fetch("/api/admin/site-branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brandingName,
          logoUrl: brandingLogoUrl,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error || "فشل حفظ الإعدادات");
      await branding.refetch();
      toast.success("تم حفظ اسم الموقع واللوجو");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل العملية");
    } finally {
      setBrandingLoading(false);
    }
  };

  const saveTopStripImage = async () => {
    setBrandingLoading(true);
    try {
      const r = await fetch("/api/admin/site-branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topStripImageUrl: brandingTopStripImageUrl,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error || "فشل حفظ صورة الشريط العلوي");
      await branding.refetch();
      toast.success("تم حفظ صورة الشريط العلوي");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل العملية");
    } finally {
      setBrandingLoading(false);
    }
  };

  const onPickBrandingLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBrandingLoading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!r.ok) throw new Error(j.error || "فشل رفع اللوجو");
      if (!j.url) throw new Error("لا يوجد رابط للوجو");
      setBrandingLogoUrl(j.url);
      toast.success("تم رفع اللوجو، اضغط حفظ لتطبيقه");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل العملية");
    } finally {
      setBrandingLoading(false);
    }
  };

  const onPickTopStripImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBrandingLoading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const j = (await r.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!r.ok) throw new Error(j.error || "فشل رفع صورة الشريط العلوي");
      if (!j.url) throw new Error("لا يوجد رابط للصورة");
      setBrandingTopStripImageUrl(j.url);
      toast.success("تم رفع صورة الشريط العلوي، اضغط حفظ لتطبيقها");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل العملية");
    } finally {
      setBrandingLoading(false);
    }
  };

  const items = data?.items ?? [];
  const linkableProductOptions = linkableProducts.data ?? [];
  const linkableSectionOptions = linkableSections.data ?? [];

  const sideCurrentTarget: "none" | "section" | "product" = sidePanel.data?.linkedProductId
    ? "product"
    : sidePanel.data?.linkedSectionId
      ? "section"
      : "none";
  const sideCurrentValue =
    sideCurrentTarget === "product"
      ? sidePanel.data?.linkedProductId ?? ""
      : sideCurrentTarget === "section"
        ? sidePanel.data?.linkedSectionId ?? ""
        : "";
  const sideDraftValue =
    sideLinkTarget === "product" ? sideLinkedProductId : sideLinkTarget === "section" ? sideLinkedSectionId : "";
  const sideLinkDirty = sideCurrentTarget !== sideLinkTarget || sideCurrentValue !== sideDraftValue;

  const brandingLogoFileRef = useRef<HTMLInputElement>(null);
  const brandingTopStripFileRef = useRef<HTMLInputElement>(null);

  const brandingIdentityDirty =
    (branding.data?.name ?? "") !== brandingName || (branding.data?.logoUrl ?? null) !== brandingLogoUrl;
  const topStripDirty = (branding.data?.topStripImageUrl ?? null) !== brandingTopStripImageUrl;

  if (isError) return <p className="text-destructive">رفض الوصول أو خطأ في الخادم.</p>;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Link href="/admin" className="text-sm text-zinc-500 hover:text-cyan-400">
            ← العودة للوحة التحكم
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-white">إعدادات الصفحة الرئيسية</h1>
        </div>
        <Skeleton className="h-[min(32rem,70vh)] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-sm text-zinc-500 hover:text-cyan-400"
        >
          ← العودة للوحة التحكم
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">إعدادات الصفحة الرئيسية</h1>
        <p className="mt-1 text-sm text-zinc-500">
          اداره كل شي في الصفحه الرئيسيه للمتجر التي تظهر للمستخدم
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/70">
        <CardHeader>
          <CardTitle className="text-zinc-100">اسم الموقع واللوجو</CardTitle>
          <CardDescription className="text-zinc-500">
            التحكم في الاسم واللوجو وصورة الشريط العلوي الظاهرين في أعلى واجهة المتجر.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <div className="space-y-3">
              <div>
                <Label className="text-zinc-300">اسم الموقع (اختياري)</Label>
                <Input
                  className="mt-1 border-zinc-700 bg-zinc-950"
                  value={brandingName}
                  onChange={(e) => setBrandingName(e.target.value)}
                  placeholder="مثال: NebulaPlay مصر"
                />
              </div>
              <input
                ref={brandingLogoFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickBrandingLogo}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                  disabled={brandingLoading}
                  onClick={() => brandingLogoFileRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {brandingLoading ? "جاري الرفع…" : "رفع لوجو"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-600 text-zinc-300"
                  disabled={brandingLoading || !brandingLogoUrl}
                  onClick={() => setBrandingLogoUrl(null)}
                >
                  حذف اللوجو
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-cyan-700/90 text-white hover:bg-cyan-700 disabled:opacity-50"
                  disabled={!brandingIdentityDirty || brandingLoading}
                  onClick={saveBrandingIdentity}
                >
                  حفظ التعديل
                </Button>
              </div>

              <div className="border-t border-zinc-800 pt-3">
                <Label className="text-zinc-300">صورة الشريط العلوي (اختياري)</Label>
                <p className="mt-1 text-xs text-zinc-500">
                  هذه الصورة تظهر أعلى الهيدر (بانر وسائل الدفع). لو حذفتها سيتم استخدام الصورة الافتراضية.
                </p>
                <input
                  ref={brandingTopStripFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickTopStripImage}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                    disabled={brandingLoading}
                    onClick={() => brandingTopStripFileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {brandingLoading ? "جاري الرفع…" : "رفع صورة الشريط العلوي"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-zinc-600 text-zinc-300"
                    disabled={brandingLoading || !brandingTopStripImageUrl}
                    onClick={() => setBrandingTopStripImageUrl(null)}
                  >
                    حذف صورة الشريط
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="bg-cyan-700/90 text-white hover:bg-cyan-700 disabled:opacity-50"
                    disabled={!topStripDirty || brandingLoading}
                    onClick={saveTopStripImage}
                  >
                    حفظ صورة الشريط
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-xs text-zinc-500">معاينة اللوجو</div>
              <div className="flex items-start justify-start sm:justify-end">
                {brandingLogoUrl ? (
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border border-zinc-700 bg-zinc-950">
                    <Image
                      src={resolveImageUrlForClient(brandingLogoUrl) ?? brandingLogoUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                      unoptimized={shouldUnoptimizeImageSrc(resolveImageUrlForClient(brandingLogoUrl) ?? brandingLogoUrl)}
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-zinc-700 bg-zinc-950 text-center text-[11px] text-zinc-500">
                    بدون لوجو
                  </div>
                )}
              </div>
              <div className="text-xs text-zinc-500">معاينة صورة الشريط العلوي</div>
              <div className="relative h-14 w-full overflow-hidden rounded-md border border-zinc-700 bg-zinc-950">
                <Image
                  src={resolveImageUrlForClient(brandingTopStripImageUrl) ?? brandingTopStripImageUrl ?? "/payments-strip.png"}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="224px"
                  unoptimized={shouldUnoptimizeImageSrc(
                    resolveImageUrlForClient(brandingTopStripImageUrl) ?? brandingTopStripImageUrl ?? "/payments-strip.png"
                  )}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/70">
        <CardHeader>
          <CardTitle className="text-zinc-100">صور السلايدر الرئيسي ({items.length})</CardTitle>
          <CardDescription className="text-zinc-500">
            هذه هي الصور الكبيرة التي تظهر في واجهة الصفحة الرئيسية للمتجر.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-medium text-zinc-400">إضافة صورة جديدة للسلايدر الرئيسي</p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={uploading}
                className="gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {uploading ? "جاري رفع الصورة…" : "1) رفع صورة"}
              </Button>
              {pendingSlideImageUrl ? (
                <span className="rounded-full border border-emerald-600/40 bg-emerald-950/30 px-2 py-1 text-xs text-emerald-300">
                  تم رفع الصورة وجاهزة للإضافة
                </span>
              ) : (
                <span className="text-xs text-zinc-500">ارفع الصورة أولاً ثم اكتب النصوص (اختياري)</span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-zinc-300">عنوان (اختياري)</Label>
                <Input
                  className="mt-1 border-zinc-700 bg-zinc-950"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="مثال: تخفيضات"
                />
              </div>
              <div>
                <Label className="text-zinc-300">وصف قصير (اختياري)</Label>
                <Input
                  className="mt-1 border-zinc-700 bg-zinc-950"
                  value={subline}
                  onChange={(e) => setSubline(e.target.value)}
                  placeholder="مثال: وفر أكثر"
                />
              </div>
            </div>
            <div>
              <Label className="text-zinc-300">ربط بمنتج (اختياري)</Label>
              <ProductCombobox
                className="mt-1"
                value={selectedLinkedProductId}
                onChange={setSelectedLinkedProductId}
                options={linkableProductOptions}
                placeholder="اختر منتجًا للربط"
                disabled={linkableProducts.isLoading}
              />
              {linkableProducts.isError ? (
                <p className="mt-1 text-xs text-amber-400">تعذر تحميل قائمة المنتجات الآن.</p>
              ) : null}
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={!pendingSlideImageUrl || addMut.isPending}
              className="gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={addPendingSlide}
            >
              {addMut.isPending ? "جاري الإضافة…" : "2) إضافة للسلايدر"}
            </Button>
          </div>

          <div className="border-t border-zinc-800 pt-6">
            {items.length === 0 ? (
              <p className="text-sm text-zinc-500">
                لا توجد شرائح بعد — السلايدر عند الزائر يظهر فارغاً حتى تضيف صورة أعلاه.
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((row, index) => {
                  const previewSrc = resolveImageUrlForClient(row.imageUrl) ?? row.imageUrl;
                  return (
                    <li
                      key={row.id}
                      className="flex flex-col gap-3 rounded-xl border border-zinc-800/90 bg-zinc-950/50 p-4 sm:flex-row sm:items-center"
                    >
                      <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-lg border border-zinc-700 sm:h-20 sm:w-36">
                        <Image
                          src={previewSrc}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="144px"
                          unoptimized={shouldUnoptimizeImageSrc(previewSrc)}
                        />
                      </div>
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="truncate font-mono text-xs text-zinc-500">{row.id}</p>
                        {(row.headline || row.subline) && (
                          <p className="mt-1 text-zinc-200">
                            {row.headline && <span className="font-semibold">{row.headline}</span>}
                            {row.headline && row.subline && " — "}
                            {row.subline && <span className="text-zinc-400">{row.subline}</span>}
                          </p>
                        )}
                        {!row.headline && !row.subline && (
                          <p className="mt-1 text-zinc-500">بدون نص — صورة فقط</p>
                        )}
                        <p className="mt-1 text-xs text-zinc-400">
                          {row.linkedProductId ? "مرتبط بمنتج" : "بدون ربط منتج"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <ProductCombobox
                            className="min-w-[16rem] flex-1"
                            value={slideLinkDrafts[row.id] ?? row.linkedProductId ?? ""}
                            onChange={(nextValue) =>
                              setSlideLinkDrafts((prev) => ({ ...prev, [row.id]: nextValue }))
                            }
                            options={linkableProductOptions}
                            placeholder="اختر المنتج المرتبط"
                            disabled={linkableProducts.isLoading}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 border-zinc-600 px-3 text-xs text-zinc-200"
                            disabled={
                              updateSlideLinkMut.isPending ||
                              (slideLinkDrafts[row.id] ?? row.linkedProductId ?? "") ===
                                (row.linkedProductId ?? "")
                            }
                            onClick={() =>
                              updateSlideLinkMut.mutate({
                                id: row.id,
                                linkedProductId: (slideLinkDrafts[row.id] ?? row.linkedProductId ?? "") || null,
                              })
                            }
                          >
                            حفظ الربط
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="border-zinc-600"
                          disabled={moveMut.isPending || index === 0}
                          onClick={() => moveMut.mutate({ id: row.id, move: "up" })}
                          aria-label="تحريك لأعلى القائمة"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="border-zinc-600"
                          disabled={moveMut.isPending || index === items.length - 1}
                          onClick={() => moveMut.mutate({ id: row.id, move: "down" })}
                          aria-label="تحريك لأسفل القائمة"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="destructive"
                          disabled={delMut.isPending}
                          onClick={() => delMut.mutate(row.id)}
                          aria-label="حذف"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/50 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-200">صورة البطاقة الجانبية المتوهجة</p>
              <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] text-zinc-400">
                قسم منفصل
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <div className="space-y-3">
                <p className="text-xs leading-relaxed text-zinc-500">
                  هذه الصورة تخص الكارت الجانبي في الصفحة الرئيسية. عند حذفها يختفي الكارت الجانبي ويتمدد السلايدر الكبير تلقائياً.
                </p>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                  <Label className="text-zinc-300">ربط البطاقة الجانبية</Label>
                  <p className="mt-1 text-xs text-zinc-500">يمكنك ربطها بقسم أو منتج كما هو متاح في السلايدر الرئيسي.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={sideLinkTarget === "none" ? "secondary" : "outline"}
                      className={sideLinkTarget === "none" ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"}
                      onClick={() => setSideLinkTarget("none")}
                      disabled={sideUploading}
                    >
                      بدون ربط
                    </Button>
                    <Button
                      type="button"
                      variant={sideLinkTarget === "section" ? "secondary" : "outline"}
                      className={sideLinkTarget === "section" ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"}
                      onClick={() => setSideLinkTarget("section")}
                      disabled={sideUploading}
                    >
                      ربط بقسم
                    </Button>
                    <Button
                      type="button"
                      variant={sideLinkTarget === "product" ? "secondary" : "outline"}
                      className={sideLinkTarget === "product" ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"}
                      onClick={() => setSideLinkTarget("product")}
                      disabled={sideUploading}
                    >
                      ربط بمنتج
                    </Button>
                  </div>
                  {sideLinkTarget === "section" ? (
                    <div className="mt-3">
                      <Label className="text-xs text-zinc-400">اختر القسم</Label>
                      <select
                        value={sideLinkedSectionId}
                        onChange={(e) => setSideLinkedSectionId(e.target.value)}
                        className="mt-1 h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100"
                        disabled={sideUploading || linkableSections.isLoading}
                      >
                        <option value="">اختر قسمًا</option>
                        {linkableSectionOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                  {sideLinkTarget === "product" ? (
                    <div className="mt-3">
                      <Label className="text-xs text-zinc-400">اختر المنتج</Label>
                      <ProductCombobox
                        className="mt-1"
                        value={sideLinkedProductId}
                        onChange={setSideLinkedProductId}
                        options={linkableProductOptions}
                        placeholder="اختر منتجًا للربط"
                        disabled={sideUploading || linkableProducts.isLoading}
                      />
                    </div>
                  ) : null}
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-zinc-600 text-zinc-200"
                      onClick={saveSidePanelLink}
                      disabled={
                        sideUploading ||
                        !sideLinkDirty ||
                        (sideLinkTarget === "section" && !sideLinkedSectionId) ||
                        (sideLinkTarget === "product" && !sideLinkedProductId)
                      }
                    >
                      حفظ ربط البطاقة الجانبية
                    </Button>
                  </div>
                </div>
                <input ref={sideFileRef} type="file" accept="image/*" className="hidden" onChange={onPickSideFile} />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={sideUploading}
                    className="gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                    onClick={() => sideFileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {sideUploading ? "جاري الرفع…" : "رفع صورة البطاقة الجانبية"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={sideUploading || !sidePanel.data?.imageUrl}
                    className="border-zinc-600 text-zinc-300"
                    onClick={removeSidePanelImage}
                  >
                    حذف صورة البطاقة الجانبية
                  </Button>
                </div>
              </div>
              <div className="flex items-start justify-start sm:justify-end">
                {sidePanel.data?.imageUrl ? (
                  <div className="relative h-24 w-36 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950">
                    <Image
                      src={sidePanel.data.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="144px"
                      unoptimized={shouldUnoptimizeImageSrc(sidePanel.data.imageUrl)}
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-36 items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950 text-center text-[11px] text-zinc-500">
                    لا توجد صورة
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
