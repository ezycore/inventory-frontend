// coding-standard: maintained
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { SupportEnterForm } from "@/components/support/support-enter-form";

/**
 * Where Mission Control sends a support operator's browser.
 *
 * Lives under `(auth)` because it is a sign-in: the visitor has no session yet,
 * and leaves with one. The single-use code arrives as `?code=` — which is why
 * everything real happens in a client component behind `Suspense`
 * (`useSearchParams` needs it), matching the login page next door.
 */
export default function Page() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
        >
          <SupportEnterForm />
        </Suspense>
      </div>
    </div>
  );
}
