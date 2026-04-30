"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type HomeSectionOrderRow = {
  sectionKey: string;
  title: string;
  position: number;
};

const homeSectionsOrderQueryKey = ["admin-home-sections-order"];

export function HomeSectionsOrderCard() {
  const homeSectionsOrderQuery = useQuery({
    queryKey: homeSectionsOrderQueryKey,
    queryFn: async () => {
      const r = await fetch("/api/admin/home-sections");
      const j = (await r.json().catch(() => ({}))) as { items?: HomeSectionOrderRow[]; error?: string };
      if (!r.ok) throw new Error(j.error || "فشل تحميل ترتيب الأقسام");
      return { items: j.items ?? [] };
    },
  });

  const moveHomeSectionMut = useMutation({
    mutationFn: async (payload: { sectionKey: string; move: "up" | "down" }) => {
      const r = await fetch("/api/admin/home-sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moveSectionKey: payload.sectionKey,
          move: payload.move,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error || "فشل تحديث ترتيب الأقسام");
    },
    onSuccess: async () => {
      await homeSectionsOrderQuery.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="border-zinc-800 bg-zinc-900/70">
      <CardHeader>
        <CardTitle className="text-zinc-100">ترتيب أقسام الصفحة الرئيسية</CardTitle>
        <CardDescription className="text-zinc-500">
          حرّك أي قسم لأعلى أو لأسفل. هذا يحدد ترتيب ظهوره في واجهة المتجر تحت السلايدر.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {homeSectionsOrderQuery.isLoading ? (
          <p className="text-sm text-zinc-500">جاري تحميل ترتيب الأقسام...</p>
        ) : homeSectionsOrderQuery.isError ? (
          <p className="text-sm text-destructive">تعذر تحميل ترتيب الأقسام.</p>
        ) : (
          <ul className="space-y-3">
            {(homeSectionsOrderQuery.data?.items ?? []).map((section, index, arr) => (
              <li
                key={section.sectionKey}
                className="flex items-center justify-between rounded-xl border border-zinc-800/90 bg-zinc-950/50 p-4"
              >
                <div className="text-sm text-zinc-200">{section.title}</div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="border-zinc-600"
                    disabled={moveHomeSectionMut.isPending || index === 0}
                    onClick={() => moveHomeSectionMut.mutate({ sectionKey: section.sectionKey, move: "up" })}
                    aria-label="تحريك القسم لأعلى"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="border-zinc-600"
                    disabled={moveHomeSectionMut.isPending || index === arr.length - 1}
                    onClick={() => moveHomeSectionMut.mutate({ sectionKey: section.sectionKey, move: "down" })}
                    aria-label="تحريك القسم لأسفل"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
