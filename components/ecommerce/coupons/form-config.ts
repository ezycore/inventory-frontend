import type { FilterConfig } from "@/types/DataTable";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// ── Form config ─────────────────────────────────────────────────────────
// Numeric caps/limits default to 0 (kept numeric so the auto-generated Zod
// schema is satisfied); page-level `prepareSubmitData` maps 0 → undefined so
// "0" means "no cap / unlimited". Date fields use zodType "string" to keep the
// ISO value the DatePicker emits instead of coercing to a Date object.
export const couponFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "code",
      type: "input",
      label: "Code",
      placeholder: "e.g. SUMMER10",
      required: true,
      columnSpan: 6,
      className: "uppercase",
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
      name: "maxDiscountAmount",
      type: "number",
      label: "Max discount (cap)",
      placeholder: "Optional",
      columnSpan: 6,
      defaultValue: 0,
    },
    {
      name: "validFrom",
      type: "date",
      zodType: "string",
      label: "Valid from",
      columnSpan: 6,
    },
    {
      name: "validUntil",
      type: "date",
      zodType: "string",
      label: "Valid until",
      columnSpan: 6,
    },
    {
      name: "minOrderValue",
      type: "number",
      label: "Min order value",
      placeholder: "Optional",
      columnSpan: 6,
      defaultValue: 0,
    },
    {
      name: "maxUses",
      type: "number",
      label: "Max total uses",
      placeholder: "Optional",
      columnSpan: 6,
      defaultValue: 0,
    },
    {
      name: "perShopperLimit",
      type: "number",
      label: "Per-shopper limit",
      placeholder: "Optional",
      columnSpan: 6,
      defaultValue: 0,
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

export const couponDefaultValues = {
  code: "",
  type: "percentage" as const,
  value: 0,
  maxDiscountAmount: 0,
  validFrom: "",
  validUntil: "",
  minOrderValue: 0,
  maxUses: 0,
  perShopperLimit: 0,
  status: "active" as const,
};

// ── Filter config ───────────────────────────────────────────────────────
export const couponFilterConfig: FilterConfig = {
  fields: [
    {
      name: "search",
      label: "Search coupons",
      type: "text",
      placeholder: "Search by code...",
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
