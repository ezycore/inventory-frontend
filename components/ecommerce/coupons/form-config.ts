import { selectOptions } from "@/services/api/select-options";
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
      precision: 2,
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
      precision: 2,
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
      precision: 2,
      label: "Min order value",
      placeholder: "Optional",
      columnSpan: 6,
      defaultValue: 0,
    },
    {
      name: "maxUses",
      type: "number",
      precision: 0,
      label: "Max total uses",
      placeholder: "Optional",
      columnSpan: 6,
      defaultValue: 0,
    },
    {
      name: "perShopperLimit",
      type: "number",
      precision: 0,
      label: "Per-shopper limit",
      placeholder: "Optional",
      columnSpan: 6,
      defaultValue: 0,
    },
    {
      // ── Scope ──────────────────────────────────────────────────────────
      // Additive and OR'd, unlike a campaign's single `scope` enum: an item
      // matching ANY of the three lists is eligible, and leaving all three
      // empty applies the coupon to the whole order.
      name: "applicableProducts",
      // `fuseSelect`, not `select`: multiple-mode `select` stays on the
      // substring MultiSelect, and a product list needs fuzzy search.
      type: "fuseSelect",
      mode: "multiple",
      zodType: "array",
      arrayOf: "string",
      label: "Limit to products",
      placeholder: "Any product",
      helperText: "Leave every scope empty to discount the whole order.",
      columnSpan: 12,
      optionsApi: selectOptions("products", { fields: "_id,name" }),
    },
    {
      name: "applicableCategories",
      type: "select",
      mode: "multiple",
      zodType: "array",
      arrayOf: "string",
      label: "Limit to categories",
      placeholder: "Any category",
      helperText:
        "A top-level category covers its whole branch; a sub-category covers only itself.",
      columnSpan: 12,
      // BOTH levels, unlike the campaign picker. A campaign's `category` scope
      // is matched against `product.categoryId` alone, so a child there would
      // match nothing — but the coupon checker tests an item's `categoryId`
      // AND its `subcategoryId` against this one list, so either level is valid
      // here and offering only parents would remove real capability.
      optionsApi: selectOptions("categories", {
        fields: "_id,name,parentId",
      }),
      // Children are labelled "Parent > Child": a child name is unique only
      // within its parent, so a mixed flat list can otherwise show two
      // identical entries meaning different things.
      itemsCreateCallback: (response: any) =>
        (response?.data?.items ?? []).map((item: any) => ({
          ...item,
          value: item._id,
          label: item.parent?.name
            ? `${item.parent.name} › ${item.name}`
            : item.name,
        })),
    },
    {
      name: "applicableTags",
      type: "select",
      mode: "multiple",
      zodType: "array",
      arrayOf: "string",
      label: "Limit to tags",
      placeholder: "Any tag",
      helperText: "Any product carrying one of these tags is eligible.",
      columnSpan: 12,
      optionsApi: selectOptions("tags", { status: "active", fields: "_id,name" }),
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
  applicableProducts: [] as string[],
  applicableCategories: [] as string[],
  applicableTags: [] as string[],
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
