"use client";
// coding-standard: maintained

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useReconcilePlanChange } from "@/services/api";

/**
 * Handles the redirect back from a hosted checkout (Stripe, or a Bangladesh
 * collector such as SSLCommerz / PayStation).
 *
 * On `?checkout=success&session_id=...` (Stripe) it asks Mission Control to
 * reconcile the session (localhost has no inbound gateway webhook); on
 * `?checkout=success` without a session id (a collector, which MC already
 * settled server-side before redirecting) it just confirms. Either way it strips
 * the query params so a refresh doesn't re-trigger.
 *
 * The other outcomes matter as much as success, because a collector can hand the
 * browser back before the money has actually moved:
 *   - `cancel` / `fail` — nothing was charged, plan unchanged.
 *   - `pending`  — the customer left mid-payment (PayStation `processing`). The
 *     `payment-reconcile` cron settles it once it clears, so the one thing the
 *     user must not do is pay again.
 *   - `error`    — MC could not verify the payment. Same advice, plus support.
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
        // Collector: MC verified and settled it server-side before redirecting.
        toast.success(t("planUpdated"));
      }
    } else if (checkout === "cancel" || checkout === "fail") {
      toast.info(t("checkoutCancelled"));
    } else if (checkout === "pending") {
      toast.info(t("checkoutPending"), { duration: 10000 });
    } else if (checkout === "error") {
      toast.error(t("checkoutError"), { duration: 10000 });
    }

    router.replace("/dashboard/billing");
  }, [checkout, sessionId, reconcile, router, t]);

  return null;
}
