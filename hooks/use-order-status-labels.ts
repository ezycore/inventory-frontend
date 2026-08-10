// coding-standard: maintained

import { useCallback, useMemo } from "react";
import { useGetStorefrontSettings } from "@/services/api";
import {
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

  const labels = useMemo(
    () => resolveOrderStatusLabels(settings?.adminStatusLabels),
    [settings?.adminStatusLabels],
  );

  /** Label for one status, falling back to a humanized form of an unknown key. */
  const labelFor = useCallback(
    (status: string) => labels[status] ?? humanizeOrderStatus(status),
    [labels],
  );

  return { labels, labelFor };
};
