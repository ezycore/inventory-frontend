import { FilterConfig } from '@/types/DataTable'

export const categoryFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
      label: "Search category",
      type: "text",
      placeholder: "Search by category name...",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
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
  viewMode: 'popover',
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
};
