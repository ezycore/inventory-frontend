"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import type { MerchantAlert } from "@/services/api";

/**
 * One bell alert as words, in the merchant's language (backend plan D4: the alert stores the
 * event and a few values; the sentence is ours). Shared by the bell's list and the browser pop-up,
 * so both say the same thing. An event this build does not know reads as a generic line rather
 * than a raw key.
 */
export function useAlertText() {
  const t = useTranslations("layout.bell");
  return useCallback(
    (alert: MerchantAlert): { title: string; body: string } => {
      const customer = alert.data.customer_name || t("customer");
      switch (alert.eventKey) {
        case "order.placed":
          return {
            title: t("order.title", { number: alert.data.order_number ?? "" }),
            body: [alert.data.total_amount, customer].filter(Boolean).join(" · "),
          };
        case "inbox.handover":
          return { title: t("handover.title", { name: customer }), body: alert.data.reason ?? "" };
        default:
          return { title: t("generic"), body: "" };
      }
    },
    [t],
  );
}

/** Where an alert opens. */
export const alertHref = (alert: MerchantAlert): string =>
  alert.link.kind === "order" ? `/ecommerce/orders/${alert.link.id}` : `/inbox?chat=${alert.link.id}`;
