// coding-standard: maintained
import { LoginForm } from "@/components/login/login-form";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

// The language + theme toggles come from the (auth) layout — they used to be
// rendered here, which is why login was the only signed-out page that had one.
export default function Page() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10">
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
