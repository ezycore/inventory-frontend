// coding-standard: maintained
import { DynamicFormConfig } from "@/ui/components/form/type";
import type { Translator } from "@/i18n/config";

// Form configuration
const getVariantAttributeFormConfig = (t: Translator): DynamicFormConfig => ({
  fields: [
    {
      name: "name",
      type: "input",
      label: t("form.name"),
      placeholder: t("form.namePlaceholder"),
      required: true,
      columnSpan: 12,
      validation: {
        minLength: 2,
        maxLength: 50,
      },
    },
    {
      name: "values",
      type: "textarea",
      label: t("form.values"),
      placeholder: t("form.valuesPlaceholder"),
      required: true,
      rows: 3,
      columnSpan: 12,
      helperText: t("form.valuesHelper"),
      validation: {
        minLength: 1,
      },
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
  ],
});

export default getVariantAttributeFormConfig;