"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { shouldUnoptimizeImageSrc } from "@/lib/image-url";
import { toast } from "sonner";

type BrandRow = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  isVisible: boolean;
  position: number;
  productCount: number;
  linkedSectionId: string | null;
  linkedSectionTitle: string | null;
};

export default function AdminBrandsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const response = await fetch("/api/admin/brands");
      const payload = (await response.json().catch(() => ({}))) as {
        items?: BrandRow[];
        error?: string;
        needsMigration?: boolean;
        message?: string;
      };
      if (!response.ok) throw new Error(payload.error || "تعذّر تحميل العلامات.");
      return payload;
    },
  });

  const visMut = useMutation({
    mutationFn: async (p: { id: string; isVisible: boolean }) => {
      const r = await fetch(`/api/admin/brands/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: p.isVisible }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error || "فشل التحديث");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-brands"] });
      toast.success("تم تحديث الظهور");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError) return <p className="text-destructive">{(error as Error).message}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">العلامات التجارية</h1>
        <Button asChild>
          <Link href="/admin/brands/new">إضافة علامة</Link>
        </Button>
      </div>
      {data?.needsMigration ? (
        <p className="rounded-md border border-amber-600/40 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
          {data.message}
        </p>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">ظاهر</TableHead>
            <TableHead>الشعار</TableHead>
            <TableHead>الاسم</TableHead>
            <TableHead>المسار</TableHead>
            <TableHead>المنتجات</TableHead>
            <TableHead>قسم المتجر</TableHead>
            <TableHead>الترتيب</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data?.items ?? []).map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-cyan-500"
                  checked={item.isVisible}
                  disabled={visMut.isPending}
                  onChange={(e) => visMut.mutate({ id: item.id, isVisible: e.target.checked })}
                  aria-label="إظهار في الصفحة الرئيسية"
                />
              </TableCell>
              <TableCell>
                <div className="relative h-10 w-16 overflow-hidden rounded bg-muted">
                  <Image
                    src={item.logoUrl}
                    alt=""
                    fill
                    className="object-contain p-0.5"
                    unoptimized={shouldUnoptimizeImageSrc(item.logoUrl)}
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell dir="ltr" className="text-muted-foreground">
                {item.slug}
              </TableCell>
              <TableCell>{item.productCount}</TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground" title={item.linkedSectionTitle ?? ""}>
                {item.linkedSectionTitle ?? "—"}
              </TableCell>
              <TableCell>{item.position}</TableCell>
              <TableCell>
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/admin/brands/${item.id}`}>تعديل</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(data?.items?.length ?? 0) === 0 && !data?.needsMigration ? (
            <TableRow>
              <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                لا توجد علامات بعد. اضغط «إضافة علامة» للبدء.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
