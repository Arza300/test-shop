"use client";

import { useParams } from "next/navigation";
import { BrandDelete, BrandForm } from "@/components/admin/brand-form";

export default function EditBrandPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">تعديل علامة تجارية</h1>
      <BrandForm brandId={id} />
      <BrandDelete id={id} />
    </div>
  );
}
