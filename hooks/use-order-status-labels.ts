// coding-standard: maintained

import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useGetStorefrontSettings } from "@/services/api";
import {
  DEFAULT_ORDER_STATUS_LABELS,
  humanizeOrderStatus,
  resolveOrderStatusLabels,
} from "@/lib/order-status";

/**
 * The order-step wording for the current organization: the merchant's overrides
 * merged over the built-in labels.
 *
 * Every admin surface that prints a status reads through this, so a rename lands
 * everywhere at once instead of on whichever screens the change remembered to
 * touch. Presentation only — callers keep passing the canonical status to the
 * API; this decides nothing but what the operator reads.
 *
 * The settings query is shared and cached (60s), so calling this from a list row
 * costs nothing beyond the first fetch. While it is loading the built-in labels
 * render, which is the same text the merchant saw before they customised it.
 */
export const useOrderStatusLabels = () => {
  const { data: settings } = useGetStorefrontSettings();
  // The built-in wording in the viewer's language; a merchant's own rename still wins (S29).
  const t = useTranslations("ecommerce.orderStatus");
  const defaults = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(DEFAULT_ORDER_STATUS_LABELS).map((status) => [status, t(status)]),
      ),
    [t],
  );

  const labels = useMemo(
    () => resolveOrderStatusLabels(settings?.adminStatusLabels, defaults),
    [settings?.adminStatusLabels, defaults],
  );

  /** Label for one status, falling back to a humanized form of an unknown key. */
  const labelFor = useCallback(
    (status: string) => labels[status] ?? humanizeOrderStatus(status),
    [labels],
  );

  return { labels, labelFor };
};
