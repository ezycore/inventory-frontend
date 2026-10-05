// coding-standard: maintained
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
 * Exclusion list on the wire → the form field holding it. "Everything except
 * Clearance": each list carves products OUT of the scope, and always wins.
 */
export const CAMPAIGN_EXCLUDE_FIELD = {
  categoryIds: "excludeCategories",
  subcategoryIds: "excludeSubcategories",
  tagIds: "excludeTags",
  productIds: "excludeProducts",
} as const;

export type CampaignExcludeKey = keyof typeof CAMPAIGN_EXCLUDE_FIELD;

/**
 * Exclusions are offered under every scope but `product`: a hand-picked list
 * is already exactly what the merchant wants, so "except" there means "don't
 * pick it".
 */
export const scopeTakesExclusions = (scope: string | undefined) =>
  scope !== "product";

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
/** The scope select's watched value is the enriched option — compare `.value`. */
const scopeTakesExclusionsDependency = {
  field: "scope",
  matchWithProp: "value",
  condition: "ne",
  value: "product",
  action: "show",
} as const;

/**
 * Shown while the scope takes exclusions AND the merchant switched them on.
 * Scope must stay FIRST: only the primary condition gets select enrichment.
 */
const shownForExclusions = [
  scopeTakesExclusionsDependency,
  { field: "excludeEnabled", condition: "truthy" },
] as const;

/**
 * TOP-LEVEL categories only — both a category target and a category exclusion
 * match `product.categoryId`, which always holds the parent, so a child picked
 * here would match nothing. Children go through the sub-category pickers.
 */
const topLevelCategoryOptions = selectOptions("categories", {
  parentId: "null",
  fields: "_id,name",
});

/**
 * Children of ANY parent, labelled "Parent › Child": child names are unique
 * only within a parent, so a flat list of bare names can show two identical
 * entries that mean different things — on a pricing screen that is a discount
 * applied to (or withheld from) the wrong half of the catalogue. `parentId` is
 * projected so the list response resolves each row's `parent`.
 */
const subcategoryOptions = {
  optionsApi: selectOptions("categories", {
    parentId: "!null",
    fields: "_id,name,parentId",
  }),
  itemsCreateCallback: (response: any) =>
    (response?.data?.items ?? []).map((item: any) => ({
      ...item,
      value: item._id,
      label: item.parent?.name ? `${item.parent.name} › ${item.name}` : item.name,
    })),
};

const tagOptions = selectOptions("tags", { status: "active", fields: "_id,name" });
const productOptions = selectOptions("products", { fields: "_id,name" });

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
      name: "subtitle",
      type: "input",
      label: "Tagline",
      placeholder: "e.g. Three days only, on every cushion",
      helperText:
        "One line under the name on the campaign's own page. Optional.",
      columnSpan: 12,
      validation: { maxLength: 200 },
    },
    {
      // Replaces "-25%" on the product cards this campaign prices. Short
      // because it sits in a pill over a ~166px phone card.
      name: "cardBadgeLabel",
      type: "input",
      label: "Card badge",
      placeholder: "e.g. Eid Sale",
      helperText:
        "Shown on product cards instead of the discount (like -25%). Leave empty to keep the discount. Up to 16 characters.",
      columnSpan: 12,
      validation: { maxLength: 16 },
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
      // TOP-LEVEL only — see `topLevelCategoryOptions`. Targeting one child is
      // what the sub-category scope is for.
      optionsApi: topLevelCategoryOptions,
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
      // Children of ANY parent: the campaign targets one child regardless of whose it is.
      ...subcategoryOptions,
      dependsOn: shownForScope("subcategory"),
    },
    {
      name: "productTargets",
      // `fuseSelect`, not `select`: multiple-mode `select` stays on the
      // substring MultiSelect, and a product list needs fuzzy search.
      type: "fuseSelect",
      mode: "multiple",
      zodType: "array",
      arrayOf: "string",
      label: "Products",
      placeholder: "Search and select products...",
      helperText: "Only these products get the campaign discount.",
      columnSpan: 12,
      optionsApi: productOptions,
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
      optionsApi: tagOptions,
      dependsOn: shownForScope("tag"),
    },
    {
      // A switch in front of four pickers: most campaigns exclude nothing, and
      // four empty multi-selects on every form would read as required. Turning
      // it off clears the exclusions on save (see `campaignExclusionsBody`).
      name: "excludeEnabled",
      type: "switch",
      label: "Exclude some products",
      helperText:
        "Leave out categories, sub-categories, tags or products — e.g. everything except Clearance.",
      columnSpan: 12,
      defaultValue: false,
      dependsOn: scopeTakesExclusionsDependency,
    },
    {
      name: CAMPAIGN_EXCLUDE_FIELD.categoryIds,
      type: "select",
      mode: "multiple",
      zodType: "array",
      arrayOf: "string",
      label: "Except categories",
      placeholder: "Search and select categories...",
      helperText: "No product in these categories gets the discount — sub-categories included.",
      columnSpan: 12,
      optionsApi: topLevelCategoryOptions,
      dependsOn: [...shownForExclusions],
    },
    {
      name: CAMPAIGN_EXCLUDE_FIELD.subcategoryIds,
      type: "select",
      mode: "multiple",
      zodType: "array",
      arrayOf: "string",
      label: "Except sub-categories",
      placeholder: "Search and select sub-categories...",
      helperText:
        "Only these sub-categories are left out — the rest of their parent still gets it.",
      columnSpan: 12,
      ...subcategoryOptions,
      dependsOn: [...shownForExclusions],
    },
    {
      name: CAMPAIGN_EXCLUDE_FIELD.tagIds,
      type: "select",
      mode: "multiple",
      zodType: "array",
      arrayOf: "string",
      label: "Except tags",
      placeholder: "Search and select tags...",
      helperText: "A product carrying any of these tags is left out.",
      columnSpan: 12,
      optionsApi: tagOptions,
      dependsOn: [...shownForExclusions],
    },
    {
      // `fuseSelect`: a multiple-mode product picker must be fuzzy-searchable.
      name: CAMPAIGN_EXCLUDE_FIELD.productIds,
      type: "fuseSelect",
      mode: "multiple",
      zodType: "array",
      arrayOf: "string",
      label: "Except products",
      placeholder: "Search and select products...",
      helperText: "These products are left out.",
      columnSpan: 12,
      optionsApi: productOptions,
      dependsOn: [...shownForExclusions],
    },
    {
      name: "createPage",
      type: "switch",
      label: "Create a page for this campaign",
      helperText:
        "Off, the campaign link shows the sale's banner and its products. On, you get an editable page at that same link — add a countdown, reviews, a video. You can add one later from the campaign's row.",
      columnSpan: 12,
      defaultValue: false,
      // Create only. Editing a campaign must not offer it: the page either
      // exists or it does not, and switching a field off would read as "delete
      // my page" without saying so. Adding one later is the row's own action,
      // and removing one is deleting that page in Pages.
      hideInEdit: true,
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
  subtitle: "",
  cardBadgeLabel: "",
  createPage: false,
  scope: "storewide" as const,
  type: "percentage" as const,
  value: 0,
  startsAt: "",
  endsAt: "",
  categoryTargets: [] as string[],
  subcategoryTargets: [] as string[],
  productTargets: [] as string[],
  tagTargets: [] as string[],
  excludeEnabled: false,
  excludeCategories: [] as string[],
  excludeSubcategories: [] as string[],
  excludeTags: [] as string[],
  excludeProducts: [] as string[],
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
