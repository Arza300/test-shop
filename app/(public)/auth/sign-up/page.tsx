"use client";

import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/lib/validations/auth";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Form = z.infer<typeof registerSchema>;

function SignUpForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackAfterAuth = search.get("callbackUrl") ?? "/";
  const form = useForm<Form>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>إنشاء حساب</CardTitle>
          <CardDescription>أنشئ حسابك للشراء والمتابعة بسهولة.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              const r = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
              });
              const j = await r.json().catch(() => ({}));
              if (!r.ok) {
                toast.error(j.error || "تعذّر التسجيل");
                return;
              }
              const res = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
              if (res?.error) {
                toast.success("تم إنشاء الحساب. سجّل الدخول.");
                router.push(`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackAfterAuth)}`);
                return;
              }
              router.push(callbackAfterAuth);
            })}
          >
            <div>
              <Label htmlFor="name">الاسم</Label>
              <Input id="name" {...form.register("name")} className="mt-1" autoComplete="name" />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" {...form.register("email")} className="mt-1" autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" {...form.register("password")} className="mt-1" autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "جاري الإنشاء…" : "إنشاء الحساب"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              لديك حساب بالفعل؟{" "}
              <Link
                className="text-primary underline"
                href={`/auth/sign-in?callbackUrl=${encodeURIComponent(callbackAfterAuth)}`}
              >
                تسجيل الدخول
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Fallback() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>إنشاء حساب</CardTitle>
          <CardDescription>أنشئ حسابك للشراء والمتابعة بسهولة.</CardDescription>
        </CardHeader>
        <CardContent className="h-48 animate-pulse rounded-md bg-muted" />
      </Card>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <SignUpForm />
    </Suspense>
  );
}
