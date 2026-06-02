"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useReconcilePlanChange } from "@/services/api";

/**
 * Handles the redirect back from a hosted checkout (Stripe / SSLCommerz).
 *
 * On `?checkout=success&session_id=...` it asks Mission Control to reconcile the
 * session (localhost has no inbound gateway webhook), then strips the query
 * params so a refresh doesn't re-trigger. On `?checkout=cancel|fail` it just
 * informs the user and clears the params.
 */
export function CheckoutReturnHandler() {
  const params = useSearchParams();
  const router = useRouter();
  const reconcile = useReconcilePlanChange();
  const handled = useRef(false);

  const checkout = params.get("checkout");
  const sessionId = params.get("session_id");

  useEffect(() => {
    if (handled.current || !checkout) return;
    handled.current = true;

    if (checkout === "success" && sessionId) {
      reconcile.mutate(
        { sessionId },
        {
          onSuccess: () => toast.success("Your plan has been updated."),
        },
      );
    } else if (checkout === "cancel" || checkout === "fail") {
      toast.info("Checkout was not completed. Your plan is unchanged.");
    }

    router.replace("/dashboard/billing");
  }, [checkout, sessionId, reconcile, router]);

  return null;
}
