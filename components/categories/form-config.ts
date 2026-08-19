// coding-standard: maintained
import { selectOptions } from "@/services/api/select-options";
import type { DynamicFormConfig } from '@/ui/components/form/type'
import type { Translator } from '@/i18n/config'
import { RECOMMENDED } from "@/lib/image-ratio";

/**
 * `status=active` matters here for the same reason it does on the product form:
 * rates are SUPERSEDED, not edited, so a retired rate must not stay selectable.
 * No `defaultFlag` — a category default has to be a deliberate choice, otherwise
 * every category would silently claim the org-wide rate and the fallback would
 * never be reached.
 */
export const TAX_OPTIONS_API = selectOptions("taxes", {
  status: "active",
  fields: "_id,name,rate,vatCategory",
});

/**
 * Top-level categories only — a sub-category cannot itself be a parent (the tree
 * is exactly two levels), so offering one here would only produce a rejected
 * save. `parentId=null` is the backend's "top level only" filter.
 */
export const PARENT_CATEGORY_OPTIONS_API = selectOptions("categories", {
  parentId: "null",
  status: "active",
  fields: "_id,name",
});

/**
 * `isDefault` is meaningless on a sub-category — only a top-level category can
 * be the org default, and the product form prefills one category. Shown only
 * while no parent is selected.
 *
 * `defaultTaxId` is deliberately NOT gated this way: a child inherits its
 * parent's rate but may override it, so the field is offered at both levels.
 */
const TOP_LEVEL_ONLY = {
  field: "parentId",
  condition: "falsy",
  action: "show",
} as const;

/**
 * Static English config — used by the module-scope quick-add registry and the
 * settings/fields field-visibility tool, neither of which can call
 * `useTranslations`. The real Categories page uses `getCategoryFormConfig(t)`.
 */
export const categoryFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "parentId",
      type: "select",
      label: "Parent category",
      placeholder: "None — this is a top-level category",
      columnSpan: 12,
      optionsApi: PARENT_CATEGORY_OPTIONS_API,
      helperText:
        "Leave empty for a top-level category. Picking a parent makes this a sub-category, reachable at /parent/this-one.",
    },
    {
      name: "name",
      type: "input",
      label: "Category Name",
      placeholder: "Enter category name",
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 100 },
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      placeholder: "Enter category description",
      rows: 3,
      columnSpan: 12,
      validation: { maxLength: 500 },
    },
    {
      name: "images",
      type: "file-upload",
      label: "Category Image",
      placeholder: "Upload category image",
      columnSpan: 12,
      accept: "image/*",
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024, // 5MB per file
      fileTypes: ["jpg", "jpeg", "png", "webp"],
      dropzoneText: "Square 600 × 600 px works best · PNG, JPG, WEBP up to 5MB",
      recommended: RECOMMENDED.category,
      showPreview: true,
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 12,
      defaultValue: "active",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    {
      name: "isDefault",
      type: "checkbox",
      label: "Set as default category",
      description: "Pre-selected on new product forms",
      columnSpan: 12,
      defaultValue: false,
      dependsOn: TOP_LEVEL_ONLY,
    },
    {
      name: "defaultTaxId",
      type: "select",
      label: "Default VAT rate",
      columnSpan: 12,
      optionsApi: TAX_OPTIONS_API,
      placeholder: "Inherit — parent, then the organization default",
      helperText:
        "Prefilled on new products in this category, on both the purchase and the sales side. Leave empty to inherit: a sub-category falls back to its parent's rate, a top-level one to the organization default. Existing products are never re-priced.",
    },
  ],
}

export const getCategoryFormConfig = (t: Translator): DynamicFormConfig => ({
  fields: [
    {
      name: "parentId",
      type: "select",
      label: t("form.parent"),
      placeholder: t("form.parentPlaceholder"),
      columnSpan: 12,
      optionsApi: PARENT_CATEGORY_OPTIONS_API,
      helperText: t("form.parentHint"),
    },
    {
      name: "name",
      type: "input",
      label: t("form.name"),
      placeholder: t("form.namePlaceholder"),
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 100 },
    },
    {
      name: "description",
      type: "textarea",
      label: t("form.description"),
      placeholder: t("form.descriptionPlaceholder"),
      rows: 3,
      columnSpan: 12,
      validation: { maxLength: 500 },
    },
    {
      name: "images",
      type: "file-upload",
      label: t("form.images"),
      placeholder: t("form.imagesPlaceholder"),
      columnSpan: 12,
      accept: "image/*",
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024,
      fileTypes: ["jpg", "jpeg", "png", "webp"],
      dropzoneText: t("form.imagesDropzone"),
      showPreview: true,
    },
    {
      name: "status",
      type: "select",
      label: t("form.status"),
      required: true,
      columnSpan: 12,
      defaultValue: "active",
      options: [
        { value: "active", label: t("form.statusActive") },
        { value: "inactive", label: t("form.statusInactive") },
      ],
    },
    {
      name: "isDefault",
      type: "checkbox",
      label: t("form.isDefault"),
      description: t("form.isDefaultDescription"),
      columnSpan: 12,
      defaultValue: false,
      dependsOn: TOP_LEVEL_ONLY,
    },
    {
      name: "defaultTaxId",
      type: "select",
      label: t("form.defaultTax"),
      columnSpan: 12,
      optionsApi: TAX_OPTIONS_API,
      placeholder: t("form.defaultTaxPlaceholder"),
      helperText: t("form.defaultTaxHint"),
    },
  ],
})
