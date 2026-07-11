// coding-standard: maintained
import { LoginForm } from "@/components/login/login-form";
import { LocaleToggle } from "@/components/shared/locale-toggle";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

export default function Page() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <LocaleToggle className="absolute top-4 right-4 md:top-6 md:right-6" />
      <div className="w-full max-w-sm">
        <Suspense
          fallback={
            <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
