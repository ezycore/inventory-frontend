import type { FilterConfig } from "@/types/DataTable";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// Date fields use zodType "string" to keep the ISO value the DatePicker emits.
// `categoryTargets`/`productTargets` are API-backed multi-selects, each shown for
// its scope; page-level prepareSubmitData folds the active one into `targets`
// (an id string array) so admins pick by name instead of pasting Mongo IDs.
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
      name: "categoryTargets",
      type: "select",
      mode: "multiple",
      zodType: "array",
      arrayOf: "string",
      label: "Categories",
      placeholder: "Search and select categories...",
      helperText: "Only these categories get the campaign discount.",
      columnSpan: 12,
      optionsApi: "/categories?all=true&fields=_id,name",
      // scope is a static-option select, so its watched value is enriched to the
      // full option object — match on `.value` to compare the string.
      dependsOn: { field: "scope", matchWithProp: "value", condition: "eq", value: "category", action: "show" },
    },
    {
      name: "productTargets",
      type: "select",
      mode: "multiple",
      zodType: "array",
      arrayOf: "string",
      label: "Products",
      placeholder: "Search and select products...",
      helperText: "Only these products get the campaign discount.",
      columnSpan: 12,
      optionsApi: "/products?all=true&fields=_id,name",
      dependsOn: { field: "scope", matchWithProp: "value", condition: "eq", value: "product", action: "show" },
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
  categoryTargets: [] as string[],
  productTargets: [] as string[],
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
