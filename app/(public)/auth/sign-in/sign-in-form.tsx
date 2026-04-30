"use client";

import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations/auth";
import { z } from "zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type Form = z.infer<typeof loginSchema>;

export function SignInForm() {
  const search = useSearchParams();
  const callback = search.get("callbackUrl") ?? "/";
  const form = useForm<Form>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>تسجيل الدخول</CardTitle>
          <CardDescription>أدخل البريد الإلكتروني وكلمة المرور.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              const res = await signIn("credentials", { email: values.email, password: values.password, redirect: false });
              if (res?.error) {
                toast.error("البريد أو كلمة المرور غير صحيحة");
                return;
              }
              window.location.href = callback;
            })}
          >
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input id="email" type="email" className="mt-1" {...form.register("email")} autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <Input id="password" type="password" className="mt-1" {...form.register("password")} autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "جاري الدخول…" : "دخول"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ليس لديك حساب؟{" "}
              <Link
                className="text-primary underline"
                href={`/auth/sign-up?callbackUrl=${encodeURIComponent(callback)}`}
              >
                إنشاء حساب
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
