import { Suspense } from "react";
import { SignInForm } from "./sign-in-form";
import { Skeleton } from "@/components/ui/skeleton";

function Fallback() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <SignInForm />
    </Suspense>
  );
}
