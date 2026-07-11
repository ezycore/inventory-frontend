// coding-standard: maintained
import type { PurchaseOrderFilters } from "@/types";
import type { FilterConfig } from "@/types/DataTable";
import type { FilterField } from "@/types/filter";
import type { Translator } from "@/i18n/config";

import { ALL_ORDER_STATUSES } from "../orders/filters";

/** `t` is bound to the `purchases` namespace. */
const buildFilterFields = (t: Translator): FilterField[] => [
  {
    name: "status",
    label: t("orders.filterStatus"),
    type: "select",
    options: [
      { label: t("orders.allStatuses"), value: ALL_ORDER_STATUSES },
      { label: t("status.draft"), value: "draft" },
      { label: t("status.received"), value: "received" },
      { label: t("status.ordered"), value: "ordered" },
      { label: t("status.partial"), value: "partial" },
      { label: t("status.cancelled"), value: "cancelled" },
    ],
  },
  {
    name: "search",
    label: t("orders.filterSearch"),
    type: "text",
    placeholder: t("history.filterSearchPlaceholder"),
  },
];

interface BuildFilterConfigParams {
  onApply: (newFilters: PurchaseOrderFilters) => void;
  onReset: () => void;
  t: Translator;
}

export const buildHistoryFilterConfig = ({
  onApply,
  onReset,
  t,
}: BuildFilterConfigParams): FilterConfig => ({
  fields: buildFilterFields(t),
  onApply: (newFilters) => onApply(newFilters as PurchaseOrderFilters),
  onReset,
});
