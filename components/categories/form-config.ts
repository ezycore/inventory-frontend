// coding-standard: maintained
import type { DynamicFormConfig } from '@/ui/components/form/type'
import type { Translator } from '@/i18n/config'

/**
 * `status=active` matters here for the same reason it does on the product form:
 * rates are SUPERSEDED, not edited, so a retired rate must not stay selectable.
 * No `defaultFlag` — a category default has to be a deliberate choice, otherwise
 * every category would silently claim the org-wide rate and the fallback would
 * never be reached.
 */
export const TAX_OPTIONS_API =
  '/taxes?all=true&status=active&fields=_id,name,rate,vatCategory'

/**
 * Static English config — used by the module-scope quick-add registry and the
 * settings/fields field-visibility tool, neither of which can call
 * `useTranslations`. The real Categories page uses `getCategoryFormConfig(t)`.
 */
export const categoryFormConfig: DynamicFormConfig = {
  fields: [
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
      dropzoneText: "PNG, JPG, WEBP up to 5MB",
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
    },
    {
      name: "defaultTaxId",
      type: "select",
      label: "Default VAT rate",
      columnSpan: 12,
      optionsApi: TAX_OPTIONS_API,
      placeholder: "Use the organization default",
      helperText:
        "Prefilled on new products in this category, on both the purchase and the sales side. Existing products are never re-priced.",
    },
  ],
}

export const getCategoryFormConfig = (t: Translator): DynamicFormConfig => ({
  fields: [
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
