import { FilterConfig } from "@/types/DataTable";

export const inventoryFilterConfig: FilterConfig = {
  fields: [
    {
      name: "productId",
      label: "Product",
      type: "select",
      placeholder: "All products",
      columnSpan: 1,
      options: [], // Will be populated dynamically via API
    },
    {
      name: "locationId",
      label: "Location",
      type: "select",
      placeholder: "All locations",
      columnSpan: 1,
      options: [], // Will be populated dynamically via API
    },
    {
      name: "isLowStock",
      label: "Stock Level",
      type: "select",
      placeholder: "All levels",
      columnSpan: 1,
      options: [
        { label: "Low Stock", value: "true" },
        { label: "Healthy", value: "false" },
      ],
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
      columnSpan: 1,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ],
  viewMode: "popover",
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
};

export const inventorySearchConfig = {
  globalSearch: true,
  placeholder: "Search by product name, SKU, or location...",
};
