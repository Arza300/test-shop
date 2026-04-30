"use client";

import Image from "next/image";
import { useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { resolveImageUrlForClient, shouldUnoptimizeImageSrc } from "@/lib/image-url";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type SectionItem = {
  id: string;
  sectionId: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  price: string;
  oldPrice: string | null;
  hasVariants: boolean;
  variants: Array<{ name: string; price: string }>;
  stock: number;
  isActive: boolean;
  position: number;
};

type SectionRow = {
  id: string;
  title: string;
  showTitle: boolean;
  logoUrl: string | null;
  logoTitle: string | null;
  logoDescription: string | null;
  backgroundColor: string | null;
  cardBackgroundColor: string | null;
  isVisible: boolean;
  position: number;
  items: SectionItem[];
};

type SectionDraft = {
  title: string;
  showTitle: boolean;
  logoUrl: string | null;
  logoTitle: string | null;
  logoDescription: string | null;
  backgroundColor: string | null;
  cardBackgroundColor: string | null;
  isVisible: boolean;
};

type ItemDraft = {
  title: string;
  subtitle: string;
  imageUrl: string;
  price: string;
  oldPrice: string;
  hasVariants: boolean;
  variants: Array<{ name: string; price: string }>;
  stock: string;
  isActive: boolean;
};

const queryKey = ["admin-custom-store-sections"];

function toSectionDraft(row: SectionRow): SectionDraft {
  return {
    title: row.title,
    showTitle: row.showTitle,
    logoUrl: row.logoUrl ?? null,
    logoTitle: row.logoTitle ?? null,
    logoDescription: row.logoDescription ?? null,
    backgroundColor: row.backgroundColor ?? null,
    cardBackgroundColor: row.cardBackgroundColor ?? null,
    isVisible: row.isVisible,
  };
}

function colorInputValue(value: string | null): string {
  if (typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value)) return value;
  return "#08379b";
}

function SectionColorPicker({
  value,
  defaultHex,
  onChange,
}: {
  value: string | null;
  defaultHex: string;
  onChange: (next: string | null) => void;
}) {
  const hasColor = value != null;
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={hasColor ? "secondary" : "outline"}
          className={
            hasColor ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"
          }
          onClick={() => onChange(value ?? defaultHex)}
        >
          لون مخصص
        </Button>
        <Button
          type="button"
          variant={!hasColor ? "secondary" : "outline"}
          className={
            !hasColor ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"
          }
          onClick={() => onChange(null)}
        >
          شفاف
        </Button>
      </div>
      {hasColor ? (
        <Input
          type="color"
          className="h-10 w-14 shrink-0 border-zinc-700 bg-zinc-950 p-1"
          value={colorInputValue(value)}
          onChange={(e) => onChange(e.target.value)}
          title="اختيار اللون"
        />
      ) : null}
    </div>
  );
}

function toItemDraft(item: SectionItem): ItemDraft {
  const safeVariants = Array.isArray(item.variants) ? item.variants : [];
  return {
    title: item.title,
    subtitle: item.subtitle ?? "",
    imageUrl: item.imageUrl,
    price: item.price,
    oldPrice: item.oldPrice ?? "",
    hasVariants: Boolean(item.hasVariants),
    variants: safeVariants.map((variant) => ({ name: variant.name, price: variant.price })),
    stock: String(item.stock),
    isActive: item.isActive,
  };
}

function AdminFormBlock({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function CustomStoreSectionsManager() {
  const qc = useQueryClient();
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionLogoUrl, setNewSectionLogoUrl] = useState<string | null>(null);
  const [newSectionLogoTitle, setNewSectionLogoTitle] = useState("");
  const [newSectionLogoDescription, setNewSectionLogoDescription] = useState("");
  const [newSectionBackgroundColor, setNewSectionBackgroundColor] = useState<string | null>("#08379b");
  const [newSectionCardBackgroundColor, setNewSectionCardBackgroundColor] = useState<string | null>("#072d84");
  const [newSectionShowTitle, setNewSectionShowTitle] = useState(true);
  const [newSectionVisible, setNewSectionVisible] = useState(true);
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, SectionDraft>>({});
  const [itemDrafts, setItemDrafts] = useState<Record<string, ItemDraft>>({});
  const [newItemDrafts, setNewItemDrafts] = useState<Record<string, ItemDraft>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [expandedSectionIds, setExpandedSectionIds] = useState<Set<string>>(() => new Set());

  const toggleSectionExpanded = (id: string) => {
    setExpandedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sectionsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch("/api/admin/custom-store-sections");
      const json = (await res.json().catch(() => ({}))) as { items?: SectionRow[]; error?: string };
      if (!res.ok) throw new Error(json.error || "فشل تحميل الأقسام");
      return { items: json.items ?? [] };
    },
  });

  const sections = useMemo(() => sectionsQuery.data?.items ?? [], [sectionsQuery.data?.items]);

  const initializedSectionDrafts = useMemo(() => {
    const next: Record<string, SectionDraft> = {};
    for (const section of sections) next[section.id] = toSectionDraft(section);
    return next;
  }, [sections]);

  const initializedItemDrafts = useMemo(() => {
    const next: Record<string, ItemDraft> = {};
    for (const section of sections) {
      for (const item of section.items) next[item.id] = toItemDraft(item);
    }
    return next;
  }, [sections]);

  const ensureSectionDraft = (section: SectionRow) => sectionDrafts[section.id] ?? initializedSectionDrafts[section.id];
  const ensureItemDraft = (item: SectionItem) => itemDrafts[item.id] ?? initializedItemDrafts[item.id];

  const invalidate = () => qc.invalidateQueries({ queryKey });

  const createSectionMut = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/custom-store-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSectionTitle,
          logoUrl: newSectionLogoUrl,
          logoTitle: newSectionLogoTitle,
          logoDescription: newSectionLogoDescription,
          backgroundColor: newSectionBackgroundColor,
          cardBackgroundColor: newSectionCardBackgroundColor,
          showTitle: newSectionShowTitle,
          isVisible: newSectionVisible,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "تعذر إنشاء القسم");
    },
    onSuccess: async () => {
      setNewSectionTitle("");
      setNewSectionLogoUrl(null);
      setNewSectionLogoTitle("");
      setNewSectionLogoDescription("");
      setNewSectionBackgroundColor("#08379b");
      setNewSectionCardBackgroundColor("#072d84");
      setNewSectionShowTitle(true);
      setNewSectionVisible(true);
      await invalidate();
      toast.success("تم إنشاء القسم");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const patchSectionMut = useMutation({
    mutationFn: async (payload: { sectionId: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/custom-store-sections/${payload.sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "تعذر تعديل القسم");
    },
    onSuccess: async () => {
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteSectionMut = useMutation({
    mutationFn: async (sectionId: string) => {
      const res = await fetch(`/api/admin/custom-store-sections/${sectionId}`, { method: "DELETE" });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "تعذر حذف القسم");
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("تم حذف القسم");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createItemMut = useMutation({
    mutationFn: async (payload: { sectionId: string; body: ItemDraft }) => {
      const res = await fetch(`/api/admin/custom-store-sections/${payload.sectionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: payload.body.title,
          subtitle: payload.body.subtitle,
          imageUrl: payload.body.imageUrl,
          price: payload.body.price,
          oldPrice: payload.body.oldPrice,
          hasVariants: payload.body.hasVariants,
          variants: payload.body.variants,
          stock: payload.body.stock,
          isActive: payload.body.isActive,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "تعذر إضافة العنصر");
    },
    onSuccess: async (_data, variables) => {
      setNewItemDrafts((prev) => {
        const next = { ...prev };
        next[variables.sectionId] = {
          title: "",
          subtitle: "",
          imageUrl: "",
          price: "0",
          oldPrice: "",
          hasVariants: false,
          variants: [],
          stock: "0",
          isActive: true,
        };
        return next;
      });
      await invalidate();
      toast.success("تمت إضافة المنتج");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const patchItemMut = useMutation({
    mutationFn: async (payload: { sectionId: string; itemId: string; body: Record<string, unknown> }) => {
      const res = await fetch(`/api/admin/custom-store-sections/${payload.sectionId}/items/${payload.itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload.body),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "تعذر تعديل العنصر");
    },
    onSuccess: async () => {
      await invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteItemMut = useMutation({
    mutationFn: async (payload: { sectionId: string; itemId: string }) => {
      const res = await fetch(`/api/admin/custom-store-sections/${payload.sectionId}/items/${payload.itemId}`, {
        method: "DELETE",
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "تعذر حذف العنصر");
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("تم حذف المنتج");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: fd,
      credentials: "same-origin",
    });
    const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok) throw new Error(json.error || "فشل رفع الصورة");
    if (!json.url) throw new Error("لم يتم إرجاع رابط الصورة");
    return json.url;
  };

  if (sectionsQuery.isLoading) {
    return (
      <Card className="border-zinc-800 bg-zinc-900/70">
        <CardHeader>
          <CardTitle className="text-zinc-100">الأقسام المخصصة</CardTitle>
          <CardDescription className="text-zinc-500">جاري تحميل الأقسام...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="border-zinc-800 bg-zinc-900/70">
        <CardHeader>
          <CardTitle className="text-zinc-100">إنشاء قسم جديد</CardTitle>
          <CardDescription className="text-zinc-500">
            عرّف شكلاً جديداً يظهر في الصفحة الرئيسية، ثم يمكنك إضافة منتجات له من البطاقة الخاصة بكل قسم أدناه.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <AdminFormBlock
            title="هوية القسم والشعار"
            description="اختياري: ارفع صورة للّوجو تظهر أعلى القسم، مع نصوص توضيحية بجانب الشعار إن رغبت."
          >
            <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="text-zinc-400">رفع صورة للّوجو</Label>
                <div className="mt-1.5 max-w-md">
                  <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    className="w-full min-w-0 border-zinc-700 bg-zinc-950"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      setUploadingKey("new-section-logo");
                      try {
                        const logoUrl = await uploadImage(file);
                        setNewSectionLogoUrl(logoUrl);
                        toast.success("تم رفع لوجو القسم");
                      } catch (error) {
                        toast.error((error as Error).message);
                      } finally {
                        setUploadingKey(null);
                      }
                    }}
                  />
                  {uploadingKey === "new-section-logo" ? (
                    <span className="text-xs text-zinc-500">جاري الرفع...</span>
                  ) : null}
                  </div>
                </div>
                {newSectionLogoUrl ? (
                  <div className="mt-4 flex flex-wrap items-end gap-4">
                    <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950">
                      <Image
                        src={(resolveImageUrlForClient(newSectionLogoUrl) ?? newSectionLogoUrl)!}
                        alt=""
                        fill
                        className="object-contain p-1"
                        unoptimized={shouldUnoptimizeImageSrc(
                          resolveImageUrlForClient(newSectionLogoUrl) ?? newSectionLogoUrl
                        )}
                        sizes="96px"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setNewSectionLogoUrl(null)}>
                        إزالة اللوجو
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          if (!newSectionLogoUrl && !newSectionLogoTitle.trim() && !newSectionLogoDescription.trim()) {
                            toast.error("ارفع صورة لوجو أو املأ أحد النصوص أولاً.");
                            return;
                          }
                          toast.success("تم تثبيت إعدادات الشعار — اضغط «إضافة قسم» في الأسفل لحفظها على السيرفر.");
                        }}
                      >
                        <Save className="h-4 w-4" />
                        حفظ إعدادات الشعار
                      </Button>
                    </div>
                  </div>
                ) : null}
                <p className="mt-2 text-xs text-zinc-500">
                  يُحفظ اللوجو نهائياً على السيرفر عند الضغط على «إضافة قسم» مع باقي بيانات القسم.
                </p>
              </div>
              <div>
                <Label className="text-zinc-400">اسم تحت اللوجو (اختياري)</Label>
                <Input
                  className="mt-1.5 border-zinc-700 bg-zinc-950"
                  value={newSectionLogoTitle}
                  onChange={(e) => setNewSectionLogoTitle(e.target.value)}
                  placeholder="مثال: متاجر ستيم"
                />
              </div>
              <div>
                <Label className="text-zinc-400">وصف تحت الاسم (اختياري)</Label>
                <Input
                  className="mt-1.5 border-zinc-700 bg-zinc-950"
                  value={newSectionLogoDescription}
                  onChange={(e) => setNewSectionLogoDescription(e.target.value)}
                  placeholder="نص توضيحي قصير"
                />
              </div>
            </div>
          </AdminFormBlock>

          <Separator className="bg-zinc-800" />

          <AdminFormBlock
            title="عنوان القسم"
            description="الاسم الرئيسي للقسم كما يظهر للزائر (مثلاً: ألعاب بلايستيشن)."
          >
            <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label className="text-zinc-400">اسم القسم</Label>
                <Input
                  className="mt-1.5 w-full border-zinc-700 bg-zinc-950"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="اسم القسم"
                />
              </div>
              <Button
                type="button"
                variant={newSectionShowTitle ? "secondary" : "outline"}
                className={
                  newSectionShowTitle ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"
                }
                onClick={() => setNewSectionShowTitle((prev) => !prev)}
              >
                {newSectionShowTitle ? "إخفاء العنوان بالرئيسية" : "إظهار العنوان بالرئيسية"}
              </Button>
            </div>
          </AdminFormBlock>

          <Separator className="bg-zinc-800" />

          <AdminFormBlock
            title="الألوان"
            description="لون خلفية مساحة القسم ولون بطاقات المنتجات داخل القسم على الصفحة الرئيسية. يمكن جعل أحدهما شفافاً."
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-4">
                <Label className="text-zinc-300">لون خلفية القسم</Label>
                <p className="text-xs text-zinc-500">يملأ خلف مربع القسم بالكامل في الصفحة الرئيسية.</p>
                <SectionColorPicker
                  value={newSectionBackgroundColor}
                  defaultHex="#08379b"
                  onChange={setNewSectionBackgroundColor}
                />
              </div>
              <div className="space-y-2 rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-4">
                <Label className="text-zinc-300">لون خلفية البطاقات</Label>
                <p className="text-xs text-zinc-500">خلفية كل بطاقة منتج داخل هذا القسم.</p>
                <SectionColorPicker
                  value={newSectionCardBackgroundColor}
                  defaultHex="#072d84"
                  onChange={setNewSectionCardBackgroundColor}
                />
              </div>
            </div>
          </AdminFormBlock>

          <Separator className="bg-zinc-800" />

          <AdminFormBlock
            title="الظهور في المتجر"
            description="تحكم في إظهار عنوان القسم نفسه، وفي إظهار القسم بالكامل للزوار. القسم المخفي لا يظهر في الواجهة."
          >
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={newSectionShowTitle ? "secondary" : "outline"}
                className={
                  newSectionShowTitle ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"
                }
                onClick={() => setNewSectionShowTitle((prev) => !prev)}
              >
                {newSectionShowTitle ? "عنوان القسم ظاهر" : "عنوان القسم مخفي"}
              </Button>
              <Button
                type="button"
                variant={newSectionVisible ? "secondary" : "outline"}
                className={
                  newSectionVisible ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"
                }
                onClick={() => setNewSectionVisible((prev) => !prev)}
              >
                {newSectionVisible ? "القسم ظاهر" : "القسم مخفي"}
              </Button>
            </div>
          </AdminFormBlock>

          <Button
            type="button"
            className="w-full gap-2 bg-cyan-700/90 py-6 text-base text-white hover:bg-cyan-700 sm:w-auto sm:px-10"
            disabled={createSectionMut.isPending || !newSectionTitle.trim()}
            onClick={() => createSectionMut.mutate()}
          >
            <Plus className="h-4 w-4" />
            إضافة قسم
          </Button>
        </CardContent>
      </Card>

      {sections.length === 0 ? (
        <p className="text-sm text-zinc-500">لا توجد أقسام مخصصة بعد. أنشئ قسماً جديداً بالأعلى.</p>
      ) : null}

      {sections.map((section, index) => {
            const sectionDraft = ensureSectionDraft(section);
            const isLogoBlockDirty =
              (sectionDraft.logoUrl ?? null) !== (section.logoUrl ?? null) ||
              (sectionDraft.logoTitle ?? null) !== (section.logoTitle ?? null) ||
              (sectionDraft.logoDescription ?? null) !== (section.logoDescription ?? null);
            const isSectionDirty =
              sectionDraft.title !== section.title ||
              sectionDraft.showTitle !== section.showTitle ||
              sectionDraft.logoUrl !== (section.logoUrl ?? null) ||
              sectionDraft.logoTitle !== (section.logoTitle ?? null) ||
              sectionDraft.logoDescription !== (section.logoDescription ?? null) ||
              sectionDraft.backgroundColor !== (section.backgroundColor ?? null) ||
              sectionDraft.cardBackgroundColor !== (section.cardBackgroundColor ?? null) ||
              sectionDraft.isVisible !== section.isVisible;
            const newItemDraft = newItemDrafts[section.id] ?? {
              title: "",
              subtitle: "",
              imageUrl: "",
              price: "0",
              oldPrice: "",
              hasVariants: false,
              variants: [],
              stock: "0",
              isActive: true,
            };
            const isOpen = expandedSectionIds.has(section.id);

            return (
              <Card key={section.id} className="border-zinc-800 bg-zinc-900/70">
                <CardHeader className="p-0">
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-3 px-6 py-5 text-right transition-colors hover:bg-zinc-800/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/35",
                      isOpen ? "rounded-t-xl" : "rounded-xl"
                    )}
                    onClick={() => toggleSectionExpanded(section.id)}
                    aria-expanded={isOpen}
                    aria-controls={`section-panel-${section.id}`}
                  >
                    <ChevronDown
                      className={cn("mt-0.5 h-5 w-5 shrink-0 text-zinc-400 transition-transform", isOpen && "rotate-180")}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-lg text-zinc-100">
                          قسم: {sectionDraft.title.trim() || "بدون عنوان"}
                        </CardTitle>
                        {!isOpen && isSectionDirty ? (
                          <Badge
                            variant="secondary"
                            className="border-amber-600/50 bg-amber-950/40 text-xs font-medium text-amber-200/95"
                          >
                            تعديلات غير محفوظة
                          </Badge>
                        ) : null}
                      </div>
                      <CardDescription className="text-zinc-500">
                        {isOpen
                          ? `القسم ${index + 1} من ${sections.length} — تعديل المحتوى والشكل كما يظهر في الصفحة الرئيسية، ثم احفظ التغييرات.`
                          : `القسم ${index + 1} من ${sections.length} — اضغط لعرض التعديل وإدارة المنتجات داخل القسم.`}
                      </CardDescription>
                    </div>
                  </button>
                </CardHeader>
                {isOpen ? (
                <CardContent id={`section-panel-${section.id}`} className="space-y-8">
                  <AdminFormBlock
                    title="هوية القسم والشعار"
                    description="ارفع صورة للّوجو إن رغبت، ونصوص اختيارية تظهر بجانب الشعار."
                  >
                    <div className="grid w-full max-w-xl gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <Label className="text-zinc-400">رفع صورة للّوجو</Label>
                        <div className="mt-1.5 max-w-md">
                          <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            className="w-full min-w-0 border-zinc-700 bg-zinc-950"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (!file) return;
                              setUploadingKey(`section-logo-${section.id}`);
                              try {
                                const logoUrl = await uploadImage(file);
                                setSectionDrafts((prev) => ({
                                  ...prev,
                                  [section.id]: { ...sectionDraft, logoUrl },
                                }));
                                toast.success("تم رفع لوجو القسم");
                              } catch (error) {
                                toast.error((error as Error).message);
                              } finally {
                                setUploadingKey(null);
                              }
                            }}
                          />
                          {uploadingKey === `section-logo-${section.id}` ? (
                            <span className="text-xs text-zinc-500">جاري الرفع...</span>
                          ) : null}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label className="text-zinc-400">الاسم تحت اللوجو (اختياري)</Label>
                        <Input
                          className="mt-1.5 border-zinc-700 bg-zinc-950"
                          value={sectionDraft.logoTitle ?? ""}
                          onChange={(e) =>
                            setSectionDrafts((prev) => ({
                              ...prev,
                              [section.id]: { ...sectionDraft, logoTitle: e.target.value || null },
                            }))
                          }
                          placeholder="عنوان جانبي"
                        />
                      </div>
                      <div>
                        <Label className="text-zinc-400">الوصف تحت الاسم (اختياري)</Label>
                        <Input
                          className="mt-1.5 border-zinc-700 bg-zinc-950"
                          value={sectionDraft.logoDescription ?? ""}
                          onChange={(e) =>
                            setSectionDrafts((prev) => ({
                              ...prev,
                              [section.id]: { ...sectionDraft, logoDescription: e.target.value || null },
                            }))
                          }
                          placeholder="وصف جانبي"
                        />
                      </div>
                    </div>
                    {sectionDraft.logoUrl ? (
                      <div className="mt-4 flex flex-wrap items-end gap-4">
                        <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950">
                          <Image
                            src={(resolveImageUrlForClient(sectionDraft.logoUrl) ?? sectionDraft.logoUrl)!}
                            alt=""
                            fill
                            className="object-contain p-1"
                            unoptimized={shouldUnoptimizeImageSrc(
                              resolveImageUrlForClient(sectionDraft.logoUrl) ?? sectionDraft.logoUrl
                            )}
                            sizes="96px"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSectionDrafts((prev) => ({
                              ...prev,
                              [section.id]: { ...sectionDraft, logoUrl: null },
                            }))
                          }
                        >
                          إزالة اللوجو
                        </Button>
                      </div>
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                        disabled={!isLogoBlockDirty || patchSectionMut.isPending}
                        onClick={() =>
                          patchSectionMut.mutate(
                            {
                              sectionId: section.id,
                              body: {
                                logoUrl: sectionDraft.logoUrl ?? null,
                                logoTitle: sectionDraft.logoTitle ?? null,
                                logoDescription: sectionDraft.logoDescription ?? null,
                              },
                            },
                            {
                              onSuccess: () => toast.success("تم حفظ الشعار والنصوص"),
                            }
                          )
                        }
                      >
                        <Save className="h-4 w-4" />
                        حفظ الشعار والنصوص
                      </Button>
                      {!isLogoBlockDirty ? (
                        <span className="self-center text-xs text-zinc-500">لا توجد تغييرات على هذا الجزء.</span>
                      ) : (
                        <span className="self-center text-xs text-amber-200/90">لم يُحفظ بعد — اضغط «حفظ الشعار والنصوص» أعلاه.</span>
                      )}
                    </div>
                  </AdminFormBlock>

                  <Separator className="bg-zinc-800" />

                  <AdminFormBlock
                    title="عنوان القسم"
                    description="الاسم الذي يظهر كعنوان رئيسي للقسم."
                  >
                    <div className="flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <Label className="text-zinc-400">اسم القسم</Label>
                        <Input
                          className="mt-1.5 w-full border-zinc-700 bg-zinc-950"
                          value={sectionDraft.title}
                          onChange={(e) =>
                            setSectionDrafts((prev) => ({
                              ...prev,
                              [section.id]: { ...sectionDraft, title: e.target.value },
                            }))
                          }
                          placeholder="اسم القسم"
                        />
                      </div>
                      <Button
                        type="button"
                        variant={sectionDraft.showTitle ? "secondary" : "outline"}
                        className={
                          sectionDraft.showTitle
                            ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                            : "border-zinc-700 text-zinc-300"
                        }
                        onClick={() =>
                          setSectionDrafts((prev) => ({
                            ...prev,
                            [section.id]: { ...sectionDraft, showTitle: !sectionDraft.showTitle },
                          }))
                        }
                      >
                        {sectionDraft.showTitle ? "إخفاء العنوان بالرئيسية" : "إظهار العنوان بالرئيسية"}
                      </Button>
                    </div>
                  </AdminFormBlock>

                  <Separator className="bg-zinc-800" />

                  <AdminFormBlock
                    title="الألوان"
                    description="لون خلفية منطقة القسم ولون بطاقات المنتجات داخله."
                  >
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-2 rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-4">
                        <Label className="text-zinc-300">لون خلفية القسم</Label>
                        <p className="text-xs text-zinc-500">يملأ خلف مربع القسم في الصفحة الرئيسية.</p>
                        <SectionColorPicker
                          value={sectionDraft.backgroundColor}
                          defaultHex="#08379b"
                          onChange={(next) =>
                            setSectionDrafts((prev) => ({
                              ...prev,
                              [section.id]: { ...sectionDraft, backgroundColor: next },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2 rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-4">
                        <Label className="text-zinc-300">لون خلفية البطاقات</Label>
                        <p className="text-xs text-zinc-500">خلفية بطاقة كل منتج داخل القسم.</p>
                        <SectionColorPicker
                          value={sectionDraft.cardBackgroundColor}
                          defaultHex="#072d84"
                          onChange={(next) =>
                            setSectionDrafts((prev) => ({
                              ...prev,
                              [section.id]: { ...sectionDraft, cardBackgroundColor: next },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </AdminFormBlock>

                  <Separator className="bg-zinc-800" />

                  <AdminFormBlock
                    title="الظهور في المتجر"
                    description="التحكم في إظهار عنوان القسم وإظهار القسم كاملاً للزائر."
                  >
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={sectionDraft.showTitle ? "secondary" : "outline"}
                        className={
                          sectionDraft.showTitle
                            ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                            : "border-zinc-700 text-zinc-300"
                        }
                        onClick={() =>
                          setSectionDrafts((prev) => ({
                            ...prev,
                            [section.id]: { ...sectionDraft, showTitle: !sectionDraft.showTitle },
                          }))
                        }
                      >
                        {sectionDraft.showTitle ? "عنوان القسم ظاهر" : "عنوان القسم مخفي"}
                      </Button>
                      <Button
                        type="button"
                        variant={sectionDraft.isVisible ? "secondary" : "outline"}
                        className={
                          sectionDraft.isVisible
                            ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                            : "border-zinc-700 text-zinc-300"
                        }
                        onClick={() =>
                          setSectionDrafts((prev) => ({
                            ...prev,
                            [section.id]: { ...sectionDraft, isVisible: !sectionDraft.isVisible },
                          }))
                        }
                      >
                        {sectionDraft.isVisible ? "القسم ظاهر" : "القسم مخفي"}
                      </Button>
                    </div>
                  </AdminFormBlock>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between sm:gap-6">
                    <div className="min-w-0 flex flex-col justify-center">
                      <p className="text-sm font-medium text-zinc-200">حفظ تعديلات القسم</p>
                      <p className="mt-0.5 text-xs text-zinc-500">يطبق التعديلات على الحقول أعلاه.</p>
                      <Button
                        type="button"
                        variant="secondary"
                        className="mt-3 w-full gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700 sm:w-auto"
                        disabled={!isSectionDirty || patchSectionMut.isPending}
                        onClick={() => patchSectionMut.mutate({ sectionId: section.id, body: sectionDraft })}
                      >
                        <Save className="h-4 w-4" />
                        حفظ التغييرات
                      </Button>
                    </div>
                    <div className="shrink-0 rounded-lg border border-red-900/50 bg-red-950/25 p-4 sm:max-w-xs">
                      <p className="text-sm font-medium text-red-200">منطقة حذف</p>
                      <p className="mt-1 text-xs leading-relaxed text-red-200/80">
                        حذف القسم نهائياً يشمل المنتجات داخله. لا يمكن التراجع.
                      </p>
                      <Button
                        type="button"
                        variant="destructive"
                        className="mt-3 w-full gap-2"
                        disabled={deleteSectionMut.isPending}
                        onClick={() => deleteSectionMut.mutate(section.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف القسم
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-zinc-800" />

                  <Card className="border-zinc-800/90 bg-zinc-950/40">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-zinc-100">إضافة منتج داخل القسم</CardTitle>
                      <CardDescription className="text-zinc-500">
                        أنشئ بطاقة منتج جديدة تظهر داخل هذا القسم في الواجهة. يتطلب اسماً وصورة وسعراً.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-zinc-400">الاسم</Label>
                        <Input
                          className="mt-1.5 border-zinc-700 bg-zinc-950"
                        value={newItemDraft.title}
                        onChange={(e) =>
                          setNewItemDrafts((prev) => ({
                            ...prev,
                            [section.id]: { ...newItemDraft, title: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">وصف قصير</Label>
                      <Input
                        className="mt-1 border-zinc-700 bg-zinc-950"
                        value={newItemDraft.subtitle}
                        onChange={(e) =>
                          setNewItemDrafts((prev) => ({
                            ...prev,
                            [section.id]: { ...newItemDraft, subtitle: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">السعر</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="mt-1 border-zinc-700 bg-zinc-950"
                        value={newItemDraft.price}
                        onChange={(e) =>
                          setNewItemDrafts((prev) => ({
                            ...prev,
                            [section.id]: { ...newItemDraft, price: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-zinc-400">السعر قبل الخصم (اختياري)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        className="mt-1 border-zinc-700 bg-zinc-950"
                        value={newItemDraft.oldPrice}
                        onChange={(e) =>
                          setNewItemDrafts((prev) => ({
                            ...prev,
                            [section.id]: { ...newItemDraft, oldPrice: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2 rounded-lg border border-zinc-800/90 bg-zinc-950/40 p-3">
                      <Label className="text-zinc-300">هل المنتج لديه أسعار مختلفة؟</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={newItemDraft.hasVariants ? "secondary" : "outline"}
                          className={newItemDraft.hasVariants ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"}
                          onClick={() =>
                            setNewItemDrafts((prev) => ({
                              ...prev,
                              [section.id]: { ...newItemDraft, hasVariants: true, variants: newItemDraft.variants.length ? newItemDraft.variants : [{ name: "", price: "" }] },
                            }))
                          }
                        >
                          نعم
                        </Button>
                        <Button
                          type="button"
                          variant={!newItemDraft.hasVariants ? "secondary" : "outline"}
                          className={!newItemDraft.hasVariants ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"}
                          onClick={() =>
                            setNewItemDrafts((prev) => ({
                              ...prev,
                              [section.id]: { ...newItemDraft, hasVariants: false, variants: [] },
                            }))
                          }
                        >
                          لا
                        </Button>
                      </div>
                      {newItemDraft.hasVariants ? (
                        <div className="space-y-2">
                          {newItemDraft.variants.map((variant, variantIndex) => (
                            <div key={`${section.id}-new-variant-${variantIndex}`} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
                              <Input
                                className="border-zinc-700 bg-zinc-950"
                                placeholder="اسم النوع (مثال: 25$)"
                                value={variant.name}
                                onChange={(e) =>
                                  setNewItemDrafts((prev) => {
                                    const nextVariants = [...newItemDraft.variants];
                                    nextVariants[variantIndex] = { ...variant, name: e.target.value };
                                    return { ...prev, [section.id]: { ...newItemDraft, variants: nextVariants } };
                                  })
                                }
                              />
                              <Input
                                type="number"
                                step="0.01"
                                className="border-zinc-700 bg-zinc-950"
                                placeholder="السعر"
                                value={variant.price}
                                onChange={(e) =>
                                  setNewItemDrafts((prev) => {
                                    const nextVariants = [...newItemDraft.variants];
                                    nextVariants[variantIndex] = { ...variant, price: e.target.value };
                                    return { ...prev, [section.id]: { ...newItemDraft, variants: nextVariants } };
                                  })
                                }
                              />
                              <Button
                                type="button"
                                variant="outline"
                                className="border-zinc-700 text-zinc-300"
                                onClick={() =>
                                  setNewItemDrafts((prev) => {
                                    const nextVariants = newItemDraft.variants.filter((_, idx) => idx !== variantIndex);
                                    return { ...prev, [section.id]: { ...newItemDraft, variants: nextVariants } };
                                  })
                                }
                              >
                                حذف
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="secondary"
                            className="border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                            onClick={() =>
                              setNewItemDrafts((prev) => ({
                                ...prev,
                                [section.id]: { ...newItemDraft, variants: [...newItemDraft.variants, { name: "", price: "" }] },
                              }))
                            }
                          >
                            إضافة نوع
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <div>
                      <Label className="text-zinc-400">المخزون</Label>
                      <Input
                        type="number"
                        className="mt-1 border-zinc-700 bg-zinc-950"
                        value={newItemDraft.stock}
                        onChange={(e) =>
                          setNewItemDrafts((prev) => ({
                            ...prev,
                            [section.id]: { ...newItemDraft, stock: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button
                        type="button"
                        variant={newItemDraft.isActive ? "secondary" : "outline"}
                        className={newItemDraft.isActive ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"}
                        onClick={() =>
                          setNewItemDrafts((prev) => ({
                            ...prev,
                            [section.id]: { ...newItemDraft, isActive: !newItemDraft.isActive },
                          }))
                        }
                      >
                        {newItemDraft.isActive ? "نشط" : "غير نشط"}
                      </Button>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-zinc-400">رابط الصورة</Label>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Input
                          className="border-zinc-700 bg-zinc-950"
                          value={newItemDraft.imageUrl}
                          onChange={(e) =>
                            setNewItemDrafts((prev) => ({
                              ...prev,
                              [section.id]: { ...newItemDraft, imageUrl: e.target.value },
                            }))
                          }
                        />
                        <Input
                          type="file"
                          accept="image/*"
                          className="max-w-xs border-zinc-700 bg-zinc-950"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            setUploadingKey(`new-${section.id}`);
                            try {
                              const imageUrl = await uploadImage(file);
                              setNewItemDrafts((prev) => ({
                                ...prev,
                                [section.id]: { ...newItemDraft, imageUrl },
                              }));
                              toast.success("تم رفع الصورة");
                            } catch (error) {
                              toast.error((error as Error).message);
                            } finally {
                              setUploadingKey(null);
                            }
                          }}
                        />
                        {uploadingKey === `new-${section.id}` ? (
                          <span className="text-xs text-zinc-500">جاري الرفع...</span>
                        ) : null}
                        <Button
                          type="button"
                          className="gap-2 bg-cyan-700/90 text-white hover:bg-cyan-700"
                          disabled={
                            createItemMut.isPending ||
                            !newItemDraft.title.trim() ||
                            !newItemDraft.imageUrl.trim() ||
                            !newItemDraft.price ||
                            (newItemDraft.hasVariants &&
                              (!newItemDraft.variants.length ||
                                newItemDraft.variants.some((variant) => !variant.name.trim() || !variant.price)))
                          }
                          onClick={() => createItemMut.mutate({ sectionId: section.id, body: newItemDraft })}
                        >
                          <Plus className="h-4 w-4" />
                          إضافة المنتج
                        </Button>
                      </div>
                    </div>
                      </div>
                    </CardContent>
                  </Card>

                  <AdminFormBlock
                    title="المنتجات في هذا القسم"
                    description="تعديل بيانات كل منتج ثم حفظه، أو تغيير ترتيبه داخل القسم. الحذف نهائي من منطقة الحذف بجانب كل بطاقة."
                  >
                    <div className="space-y-4">
                  {section.items.length === 0 ? (
                    <p className="text-sm text-zinc-500">لا توجد منتجات داخل هذا القسم.</p>
                  ) : null}
                  {section.items.map((item, itemIndex) => {
                    const draft = ensureItemDraft(item);
                    const isDirty =
                      draft.title !== item.title ||
                      draft.subtitle !== (item.subtitle ?? "") ||
                      draft.imageUrl !== item.imageUrl ||
                      draft.price !== item.price ||
                      draft.oldPrice !== (item.oldPrice ?? "") ||
                      draft.hasVariants !== item.hasVariants ||
                      JSON.stringify(draft.variants) !== JSON.stringify(item.variants) ||
                      draft.stock !== String(item.stock) ||
                      draft.isActive !== item.isActive;
                    const previewSrc = resolveImageUrlForClient(draft.imageUrl) ?? draft.imageUrl;

                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-zinc-800/90 bg-zinc-900/45 p-4"
                      >
                        <div className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
                          <div className="relative h-28 overflow-hidden rounded-md border border-zinc-700 bg-zinc-950">
                            {previewSrc ? (
                              <Image
                                src={previewSrc}
                                alt=""
                                fill
                                className="object-cover"
                                sizes="128px"
                                unoptimized={shouldUnoptimizeImageSrc(previewSrc)}
                              />
                            ) : null}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <Input
                              className="border-zinc-700 bg-zinc-950"
                              value={draft.title}
                              onChange={(e) =>
                                setItemDrafts((prev) => ({ ...prev, [item.id]: { ...draft, title: e.target.value } }))
                              }
                              placeholder="اسم المنتج"
                            />
                            <Input
                              className="border-zinc-700 bg-zinc-950"
                              value={draft.subtitle}
                              onChange={(e) =>
                                setItemDrafts((prev) => ({ ...prev, [item.id]: { ...draft, subtitle: e.target.value } }))
                              }
                              placeholder="وصف قصير"
                            />
                            <Input
                              className="border-zinc-700 bg-zinc-950"
                              value={draft.imageUrl}
                              onChange={(e) =>
                                setItemDrafts((prev) => ({ ...prev, [item.id]: { ...draft, imageUrl: e.target.value } }))
                              }
                              placeholder="رابط الصورة"
                            />
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                className="border-zinc-700 bg-zinc-950"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = "";
                                  if (!file) return;
                                  setUploadingKey(item.id);
                                  try {
                                    const imageUrl = await uploadImage(file);
                                    setItemDrafts((prev) => ({ ...prev, [item.id]: { ...draft, imageUrl } }));
                                    toast.success("تم رفع الصورة");
                                  } catch (error) {
                                    toast.error((error as Error).message);
                                  } finally {
                                    setUploadingKey(null);
                                  }
                                }}
                              />
                              {uploadingKey === item.id ? <Upload className="h-4 w-4 text-zinc-500" /> : null}
                            </div>
                            <Input
                              type="number"
                              step="0.01"
                              className="border-zinc-700 bg-zinc-950"
                              value={draft.price}
                              onChange={(e) =>
                                setItemDrafts((prev) => ({ ...prev, [item.id]: { ...draft, price: e.target.value } }))
                              }
                              placeholder="السعر"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              className="border-zinc-700 bg-zinc-950"
                              value={draft.oldPrice}
                              onChange={(e) =>
                                setItemDrafts((prev) => ({ ...prev, [item.id]: { ...draft, oldPrice: e.target.value } }))
                              }
                              placeholder="السعر قبل الخصم"
                            />
                            <div className="sm:col-span-2 space-y-2 rounded-lg border border-zinc-800/90 bg-zinc-950/40 p-3">
                              <Label className="text-zinc-300">هل المنتج لديه أسعار مختلفة؟</Label>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant={draft.hasVariants ? "secondary" : "outline"}
                                  className={draft.hasVariants ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"}
                                  onClick={() =>
                                    setItemDrafts((prev) => ({
                                      ...prev,
                                      [item.id]: {
                                        ...draft,
                                        hasVariants: true,
                                        variants: draft.variants.length ? draft.variants : [{ name: "", price: "" }],
                                      },
                                    }))
                                  }
                                >
                                  نعم
                                </Button>
                                <Button
                                  type="button"
                                  variant={!draft.hasVariants ? "secondary" : "outline"}
                                  className={!draft.hasVariants ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"}
                                  onClick={() =>
                                    setItemDrafts((prev) => ({ ...prev, [item.id]: { ...draft, hasVariants: false, variants: [] } }))
                                  }
                                >
                                  لا
                                </Button>
                              </div>
                              {draft.hasVariants ? (
                                <div className="space-y-2">
                                  {draft.variants.map((variant, variantIndex) => (
                                    <div key={`${item.id}-variant-${variantIndex}`} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_10rem_auto]">
                                      <Input
                                        className="border-zinc-700 bg-zinc-950"
                                        placeholder="اسم النوع"
                                        value={variant.name}
                                        onChange={(e) =>
                                          setItemDrafts((prev) => {
                                            const nextVariants = [...draft.variants];
                                            nextVariants[variantIndex] = { ...variant, name: e.target.value };
                                            return { ...prev, [item.id]: { ...draft, variants: nextVariants } };
                                          })
                                        }
                                      />
                                      <Input
                                        type="number"
                                        step="0.01"
                                        className="border-zinc-700 bg-zinc-950"
                                        placeholder="السعر"
                                        value={variant.price}
                                        onChange={(e) =>
                                          setItemDrafts((prev) => {
                                            const nextVariants = [...draft.variants];
                                            nextVariants[variantIndex] = { ...variant, price: e.target.value };
                                            return { ...prev, [item.id]: { ...draft, variants: nextVariants } };
                                          })
                                        }
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="border-zinc-700 text-zinc-300"
                                        onClick={() =>
                                          setItemDrafts((prev) => ({
                                            ...prev,
                                            [item.id]: { ...draft, variants: draft.variants.filter((_, idx) => idx !== variantIndex) },
                                          }))
                                        }
                                      >
                                        حذف
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    className="border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                                    onClick={() =>
                                      setItemDrafts((prev) => ({
                                        ...prev,
                                        [item.id]: { ...draft, variants: [...draft.variants, { name: "", price: "" }] },
                                      }))
                                    }
                                  >
                                    إضافة نوع
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                            <Input
                              type="number"
                              className="border-zinc-700 bg-zinc-950"
                              value={draft.stock}
                              onChange={(e) =>
                                setItemDrafts((prev) => ({ ...prev, [item.id]: { ...draft, stock: e.target.value } }))
                              }
                              placeholder="المخزون"
                            />
                            <Button
                              type="button"
                              variant={draft.isActive ? "secondary" : "outline"}
                              className={draft.isActive ? "border-zinc-600 bg-zinc-800 text-zinc-100" : "border-zinc-700 text-zinc-300"}
                              onClick={() =>
                                setItemDrafts((prev) => ({ ...prev, [item.id]: { ...draft, isActive: !draft.isActive } }))
                              }
                            >
                              {draft.isActive ? "نشط" : "غير نشط"}
                            </Button>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-3 border-t border-zinc-800 pt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="border-zinc-600"
                              disabled={itemIndex === 0 || patchItemMut.isPending}
                              title="نقل المنتج لأعلى"
                              onClick={() => patchItemMut.mutate({ sectionId: section.id, itemId: item.id, body: { move: "up" } })}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="border-zinc-600"
                              disabled={itemIndex === section.items.length - 1 || patchItemMut.isPending}
                              title="نقل المنتج لأسفل"
                              onClick={() => patchItemMut.mutate({ sectionId: section.id, itemId: item.id, body: { move: "down" } })}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              className="gap-2 border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                              disabled={
                                !isDirty ||
                                patchItemMut.isPending ||
                                (draft.hasVariants &&
                                  (!draft.variants.length ||
                                    draft.variants.some((variant) => !variant.name.trim() || !variant.price)))
                              }
                              onClick={() =>
                                patchItemMut.mutate({
                                  sectionId: section.id,
                                  itemId: item.id,
                                  body: {
                                    title: draft.title,
                                    subtitle: draft.subtitle,
                                    imageUrl: draft.imageUrl,
                                    price: draft.price,
                                    oldPrice: draft.oldPrice,
                                    hasVariants: draft.hasVariants,
                                    variants: draft.variants,
                                    stock: draft.stock,
                                    isActive: draft.isActive,
                                  },
                                })
                              }
                            >
                              <Save className="h-4 w-4" />
                              حفظ التعديلات
                            </Button>
                          </div>
                          <div className="rounded-lg border border-red-900/45 bg-red-950/25 p-3 sm:max-w-[12rem]">
                            <p className="text-xs leading-relaxed text-red-200/85">حذف هذا المنتج من القسم نهائياً.</p>
                            <Button
                              type="button"
                              variant="destructive"
                              className="mt-2 w-full gap-2"
                              disabled={deleteItemMut.isPending}
                              onClick={() => deleteItemMut.mutate({ sectionId: section.id, itemId: item.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                              حذف المنتج
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                    </div>
                  </AdminFormBlock>
                </CardContent>
                ) : null}
              </Card>
            );
      })}
    </div>
  );
}
