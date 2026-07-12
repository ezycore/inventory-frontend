import type { FilterConfig } from "@/types/DataTable";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// Date fields use zodType "string" to keep the ISO value the DatePicker emits.
// `targetsText` is a comma-separated input shown only for non-storewide scopes;
// page-level prepareSubmitData splits it into the `targets` string array.
export const campaignFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Name",
      placeholder: "e.g. Eid Sale",
      required: true,
      columnSpan: 6,
    },
    {
      name: "scope",
      type: "select",
      label: "Scope",
      required: true,
      columnSpan: 6,
      options: [
        { value: "storewide", label: "Storewide" },
        { value: "category", label: "Category" },
        { value: "product", label: "Product" },
      ],
    },
    {
      name: "type",
      type: "select",
      label: "Type",
      required: true,
      columnSpan: 6,
      options: [
        { value: "percentage", label: "Percentage (%)" },
        { value: "fixed", label: "Fixed amount" },
      ],
    },
    {
      name: "value",
      type: "number",
      zodType: "number",
      label: "Value",
      placeholder: "0",
      required: true,
      columnSpan: 6,
      defaultValue: 0,
      validation: { min: 0 },
    },
    {
      name: "startsAt",
      type: "date",
      zodType: "string",
      label: "Starts",
      required: true,
      columnSpan: 6,
    },
    {
      name: "endsAt",
      type: "date",
      zodType: "string",
      label: "Ends",
      required: true,
      columnSpan: 6,
    },
    {
      name: "targetsText",
      type: "input",
      label: "Category / Product IDs",
      placeholder: "id1, id2",
      helperText: "Comma-separated IDs to target with this campaign.",
      columnSpan: 12,
      dependsOn: { field: "scope", condition: "ne", value: "storewide", action: "show" },
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 6,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};

export const campaignDefaultValues = {
  name: "",
  scope: "storewide" as const,
  type: "percentage" as const,
  value: 0,
  startsAt: "",
  endsAt: "",
  targetsText: "",
  status: "active" as const,
};

export const campaignFilterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Search campaigns",
      type: "text",
      placeholder: "Search by name...",
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
  ],
  viewMode: "popover",
};

export const campaignSearchConfig = {
  globalSearch: true,
  placeholder: "Search campaigns by name...",
};
