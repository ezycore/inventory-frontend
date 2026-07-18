import type { FilterConfig } from "@/types/DataTable";

export const orderFilterConfig: FilterConfig = {
  fields: [
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Processing", value: "processing" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "delivered" },
        { label: "Returned", value: "returned" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Rejected", value: "rejected" },
      ],
    },
  ],
  viewMode: "popover",
};
