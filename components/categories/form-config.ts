// coding-standard: maintained
import type { DynamicFormConfig } from '@/ui/components/form/type'
import type { Translator } from '@/i18n/config'

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
  ],
})
