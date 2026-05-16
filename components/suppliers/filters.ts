import type { FilterConfig } from "@/types/DataTable";

export const supplierFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
      label: "Search supplier",
      type: "text",
      placeholder: "Search by supplier name...",
    },
    {
      name: "email",
      label: "Email",
      type: "text",
      placeholder: "Search by email...",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
      columnSpan: 2,
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

export const supplierSearchConfig = {
  globalSearch: true,
  placeholder: "Search suppliers by name, email, phone, or status...",
};

export const supplierDefaultValues = {
  name: "",
  email: "",
  phone: "",
  address: "",
  defaultDiscountId: "",
  status: "active" as const,
};
