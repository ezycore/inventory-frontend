import { selectOptions } from "@/services/api/select-options";
import type { FilterConfig } from "@/types/DataTable";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// Date fields use zodType "string" to keep the ISO value the DatePicker emits.
// The `*Targets` fields are API-backed multi-selects, each shown for its scope;
// page-level prepareSubmitData folds the active one into `targets` (an id string
// array) so admins pick by name instead of pasting Mongo IDs.

/**
 * scope → the form field holding its targets.
 *
 * One table because four places need the mapping — the field configs, the
 * defaults, the edit transform and the submit fold — and they must not disagree.
 * They already did: the form offered three of the backend's five scopes, so
 * `subcategory` and `tag` campaigns were implemented and unbuildable.
 *
 * `storewide` is deliberately absent: it targets nothing.
 */
export const CAMPAIGN_TARGET_FIELD = {
  category: "categoryTargets",
  subcategory: "subcategoryTargets",
  product: "productTargets",
  tag: "tagTargets",
} as const;

export type CampaignScope = keyof typeof CAMPAIGN_TARGET_FIELD | "storewide";

/**
 * How each scope is written for a merchant. Here rather than `capitalize` on the
 * raw enum, which renders `subcategory` as "Subcategory" in the table while the
 * form beside it says "Sub-category".
 */
export const CAMPAIGN_SCOPE_LABEL: Record<CampaignScope, string> = {
  storewide: "Storewide",
  category: "Category",
  subcategory: "Sub-category",
  product: "Product",
  tag: "Tag",
};

/** Show this field only while `scope` is the matching one. */
const shownForScope = (value: string) =>
  ({
    field: "scope",
    // scope is a static-option select, so its watched value is enriched to the
    // full option object — match on `.value` to compare the string.
    matchWithProp: "value",
    condition: "eq",
    value,
    action: "show",
  }) as const;
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
      // All five the engine implements. `category` covers a whole branch on its
      // own (a product under a child still stores the parent in `categoryId`),
      // so `subcategory` exists to target ONE child without its siblings.
      options: (
        Object.keys(CAMPAIGN_SCOPE_LABEL) as CampaignScope[]
      ).map((value) => ({ value, label: CAMPAIGN_SCOPE_LABEL[value] })),
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
      helperText:
        "Only these categories get the discount — including every product in their sub-categories.",
      columnSpan: 12,
      // TOP-LEVEL only. The engine matches a `category` scope against
      // `product.categoryId`, which always holds the parent, so a child picked
      // here would match no product and the campaign would silently never
      // discount anything. Targeting one child is what the scope below is for.
      optionsApi: selectOptions("categories", {
        parentId: "null",
        fields: "_id,name",
      }),
      dependsOn: shownForScope("category"),
    },
    {
      name: "subcategoryTargets",
      type: "select",
      mode: "multiple",
      zodType: "array",
      arrayOf: "string",
      label: "Sub-categories",
      placeholder: "Search and select sub-categories...",
      helperText: "Only these sub-categories get the discount — siblings are untouched.",
      columnSpan: 12,
      // Children of ANY parent: the campaign targets one child regardless of
      // whose it is. `parentId` is projected so the list response resolves each
      // row's `parent`, which the label below needs.
      optionsApi: selectOptions("categories", {
        parentId: "!null",
        fields: "_id,name,parentId",
      }),
      // Labelled "Parent › Child": child names are unique only within a parent,
      // so a flat list of bare names can show two identical entries that mean
      // different things — on a pricing screen that is a discount applied to the
      // wrong half of the catalogue.
      itemsCreateCallback: (response: any) =>
        (response?.data?.items ?? []).map((item: any) => ({
          ...item,
          value: item._id,
          label: item.parent?.name ? `${item.parent.name} › ${item.name}` : item.name,
        })),
      dependsOn: shownForScope("subcategory"),
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
      optionsApi: selectOptions("products", { fields: "_id,name" }),
      dependsOn: shownForScope("product"),
    },
    {
      name: "tagTargets",
      type: "select",
      mode: "multiple",
      zodType: "array",
      arrayOf: "string",
      label: "Tags",
      placeholder: "Search and select tags...",
      // The one many-to-many scope: "20% off everything tagged Eid Special" is
      // a single campaign instead of hand-picking eighty products.
      helperText: "Any product carrying one of these tags gets the discount.",
      columnSpan: 12,
      optionsApi: selectOptions("tags", { status: "active", fields: "_id,name" }),
      dependsOn: shownForScope("tag"),
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
  subcategoryTargets: [] as string[],
  productTargets: [] as string[],
  tagTargets: [] as string[],
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
