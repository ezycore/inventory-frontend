import { FilterConfig } from "@/types/DataTable";

export const brandFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
      label: "Search brand",
      type: "text",
      placeholder: "Search by brand...",
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
    {
      name: "createdAt",
      label: "Created Date",
      type: "date-range",
      placeholder: "Select date range",
      columnSpan: 2,
    },
    {
      name: "updatedAt",
      label: "Updated Date",
      type: "date",
      placeholder: "Select date",
      columnSpan: 2,
    },
  ],
  viewMode: "popover",
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
};
