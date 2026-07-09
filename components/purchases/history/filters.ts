import type { PurchaseOrderFilters } from "@/types";
import type { FilterConfig } from "@/types/DataTable";
import type { FilterField } from "@/types/filter";

import { ALL_ORDER_STATUSES } from "../orders/filters";

const filterFields: FilterField[] = [
  {
    name: "status",
    label: "Status",
    type: "select",
    options: [
      { label: "All Statuses", value: ALL_ORDER_STATUSES },
      { label: "Draft", value: "draft" },
      { label: "Received", value: "received" },
      { label: "Ordered", value: "ordered" },
      { label: "Partial", value: "partial" },
      { label: "Cancelled", value: "cancelled" },
    ],
  },
  {
    name: "search",
    label: "Search",
    type: "text",
    placeholder: "Order number, supplier...",
  },
];

interface BuildFilterConfigParams {
  onApply: (newFilters: PurchaseOrderFilters) => void;
  onReset: () => void;
}

export const buildHistoryFilterConfig = ({
  onApply,
  onReset,
}: BuildFilterConfigParams): FilterConfig => ({
  fields: filterFields,
  onApply: (newFilters) => onApply(newFilters as PurchaseOrderFilters),
  onReset,
});
