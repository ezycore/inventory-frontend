// coding-standard: maintained
import type { PurchaseOrderFilters } from "@/types";
import type { FilterConfig } from "@/types/DataTable";
import type { FilterField } from "@/types/filter";
import type { Translator } from "@/i18n/config";

/** Sentinel for the "no status filter" option — Select.Item forbids an empty-string value. */
export const ALL_ORDER_STATUSES = "all";

export const defaultCreatedOrderFilters: PurchaseOrderFilters = {
  status: "ordered",
};

/** `t` is bound to the `purchases` namespace. */
export const createdOrderFilterFields = (t: Translator): FilterField[] => [
  {
    name: "status",
    label: t("orders.filterStatus"),
    type: "select",
    options: [
      { label: t("status.ordered"), value: "ordered" },
      { label: t("status.partial"), value: "partial" },
      { label: t("status.draft"), value: "draft" },
      { label: t("orders.allStatuses"), value: ALL_ORDER_STATUSES },
    ],
  },
  {
    name: "search",
    label: t("orders.filterSearch"),
    type: "text",
    placeholder: t("orders.filterSearchPlaceholder"),
  },
];

interface BuildFilterConfigParams {
  onApply: (newFilters: PurchaseOrderFilters) => void;
  onReset: () => void;
  t: Translator;
}

export const buildCreatedOrdersFilterConfig = ({
  onApply,
  onReset,
  t,
}: BuildFilterConfigParams): FilterConfig => ({
  fields: createdOrderFilterFields(t),
  onApply: (newFilters) => onApply(newFilters as PurchaseOrderFilters),
  onReset,
});
