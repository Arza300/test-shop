"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CheckoutReviewingPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <Card className="border-primary/25 bg-card/90 shadow-lg shadow-primary/10">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-center">
            <span className="inline-flex h-16 w-16 animate-pulse items-center justify-center rounded-full border border-primary/35 bg-primary/10 text-2xl">
              ⏱
            </span>
          </div>
          <CardTitle className="text-center text-2xl sm:text-3xl">طلبك قيد المراجعة</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-center text-muted-foreground">
            تم استلام طلبك بنجاح، وسيتم تسليمك المنتج في غضون دقائق بعد مراجعة التحويل.
          </p>

          <div className="flex justify-center">
            <Button asChild size="lg">
              <Link href="/">العودة إلى المتجر (الصفحة الرئيسية)</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
