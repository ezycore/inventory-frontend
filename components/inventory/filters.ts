import { FilterConfig } from "@/types/DataTable";

export const inventoryFilterConfig: FilterConfig = {
  fields: [
    {
      name: "brandId",
      label: "Brand",
      type: "select",
      placeholder: "All brands",
      columnSpan: 1,
      optionsApi: "/brands?all=true&fields=_id,name", // API endpoint to fetch brand options
    },
    {
      name: "categoryId",
      label: "Category",
      type: "select",
      placeholder: "All categories",
      columnSpan: 1,
      optionsApi: "/categories?all=true&fields=_id,name", // API endpoint to fetch category options
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
  placeholder: "Search by names",
};
