"use client";
// coding-standard: maintained

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useReconcilePlanChange } from "@/services/api";

/**
 * Handles the redirect back from a hosted checkout (Stripe / SSLCommerz).
 *
 * On `?checkout=success&session_id=...` (Stripe) it asks Mission Control to
 * reconcile the session (localhost has no inbound gateway webhook); on
 * `?checkout=success` without a session id (SSLCommerz, already activated by its
 * IPN) it just confirms. Either way it strips the query params so a refresh
 * doesn't re-trigger. On `?checkout=cancel|fail` it informs the user.
 */
export function CheckoutReturnHandler() {
  const t = useTranslations("settings.billing.toasts");
  const params = useSearchParams();
  const router = useRouter();
  const reconcile = useReconcilePlanChange();
  const handled = useRef(false);

  const checkout = params.get("checkout");
  const sessionId = params.get("session_id");

  useEffect(() => {
    if (handled.current || !checkout) return;
    handled.current = true;

    if (checkout === "success") {
      if (sessionId) {
        // Stripe: localhost has no inbound webhook — reconcile, then confirm.
        reconcile.mutate(
          { sessionId },
          {
            onSuccess: () => toast.success(t("planUpdated")),
          },
        );
      } else {
        // SSLCommerz: the IPN already activated the plan — just confirm.
        toast.success(t("planUpdated"));
      }
    } else if (checkout === "cancel" || checkout === "fail") {
      toast.info(t("checkoutCancelled"));
    }

    router.replace("/dashboard/billing");
  }, [checkout, sessionId, reconcile, router, t]);

  return null;
}
