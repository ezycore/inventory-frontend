import type { PurchaseOrderFilters } from "@/types";
import type { FilterConfig } from "@/types/DataTable";
import type { FilterField } from "@/types/filter";

/** Sentinel for the "no status filter" option — Select.Item forbids an empty-string value. */
export const ALL_ORDER_STATUSES = "all";

export const defaultCreatedOrderFilters: PurchaseOrderFilters = {
  status: "ordered",
};

const filterFields: FilterField[] = [
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "Ordered", value: "ordered" },
      { label: "Partial", value: "partial" },
      { label: "Draft", value: "draft" },
      { label: "All Statuses", value: ALL_ORDER_STATUSES },
    ],
  },
  {
    name: "search",
    label: "Search",
    type: "text",
    placeholder: "Order number...",
  },
];

interface BuildFilterConfigParams {
  onApply: (newFilters: PurchaseOrderFilters) => void;
  onReset: () => void;
}

export const buildCreatedOrdersFilterConfig = ({
  onApply,
  onReset,
}: BuildFilterConfigParams): FilterConfig => ({
  fields: filterFields,
  onApply: (newFilters) => onApply(newFilters as PurchaseOrderFilters),
  onReset,
});
