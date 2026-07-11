// coding-standard: maintained
import { DynamicFormConfig } from "@/ui/components/form/type";
import type { Translator } from "@/i18n/config";

/**
 * Static English config — module-scope `config/quickAddConfig.ts` can't call
 * `useTranslations`, so it keeps this English copy. The real Discounts page
 * uses `getDiscountFormConfig(t)` below.
 */
export const discountFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Discount Name",
      placeholder: "Enter discount name",
      required: true,
      columnSpan: 12,
    },
    {
      name: "value",
      type: "number",
      label: "Discount Value",
      placeholder: "Enter discount value",
      required: true,
      columnSpan: 6,
    },
    {
      name: "type",
      type: "select",
      label: "Type",
      required: true,
      columnSpan: 6,
      defaultValue: "percentage",
      options: [
        { value: "percentage", label: "Percentage" },
        // { value: "fixed", label: "Fixed Amount" },
      ],
    },
    {
      name: "applicableTo",
      type: "select",
      label: "Applicable To",
      required: true,
      columnSpan: 6,
      options: [
        { value: "both", label: "Both (Sales & Purchase)" },
        { value: "sales", label: "Sales Only" },
        { value: "purchase", label: "Purchase Only" },
      ],
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 6,
      defaultValue: "active",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
      {
      name: "isDefaultSales",
      type: "checkbox",
      label: "Default for sales",
      description: "Pre-selected on new customer forms",
      columnSpan: 6,
      defaultValue: false,
      dependsOn: {
        field: "applicableTo",
        // applicableTo is a select; helper.tsx enriches its value to the full
        // option object, so read the `.value` off it before the `in` check.
        matchWithProp: "value",
        condition: "in",
        value: ["sales", "both"],
        action: "show",
      },
    },
    {
      name: "isDefaultPurchase",
      type: "checkbox",
      label: "Default for purchase",
      description: "Pre-selected on new supplier forms",
      columnSpan: 6,
      defaultValue: false,
      dependsOn: {
        field: "applicableTo",
        // applicableTo is a select; helper.tsx enriches its value to the full
        // option object, so read the `.value` off it before the `in` check.
        matchWithProp: "value",
        condition: "in",
        value: ["purchase", "both"],
        action: "show",
      },
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      placeholder: "Optional description for this discount",
      columnSpan: 12,
    },
  ],
};

export const getDiscountFormConfig = (t: Translator): DynamicFormConfig => ({
  fields: [
    {
      name: "name",
      type: "input",
      label: t("form.name"),
      placeholder: t("form.namePlaceholder"),
      required: true,
      columnSpan: 12,
    },
    {
      name: "value",
      type: "number",
      label: t("form.value"),
      placeholder: t("form.valuePlaceholder"),
      required: true,
      columnSpan: 6,
    },
    {
      name: "type",
      type: "select",
      label: t("form.type"),
      required: true,
      columnSpan: 6,
      defaultValue: "percentage",
      options: [
        { value: "percentage", label: t("form.percentage") },
      ],
    },
    {
      name: "applicableTo",
      type: "select",
      label: t("form.applicableTo"),
      required: true,
      columnSpan: 6,
      options: [
        { value: "both", label: t("form.applicableBoth") },
        { value: "sales", label: t("form.applicableSales") },
        { value: "purchase", label: t("form.applicablePurchase") },
      ],
    },
    {
      name: "status",
      type: "select",
      label: t("form.status"),
      required: true,
      columnSpan: 6,
      defaultValue: "active",
      options: [
        { value: "active", label: t("form.active") },
        { value: "inactive", label: t("form.inactive") },
      ],
    },
    {
      name: "isDefaultSales",
      type: "checkbox",
      label: t("form.isDefaultSales"),
      description: t("form.isDefaultSalesDescription"),
      columnSpan: 6,
      defaultValue: false,
      dependsOn: {
        field: "applicableTo",
        matchWithProp: "value",
        condition: "in",
        value: ["sales", "both"],
        action: "show",
      },
    },
    {
      name: "isDefaultPurchase",
      type: "checkbox",
      label: t("form.isDefaultPurchase"),
      description: t("form.isDefaultPurchaseDescription"),
      columnSpan: 6,
      defaultValue: false,
      dependsOn: {
        field: "applicableTo",
        matchWithProp: "value",
        condition: "in",
        value: ["purchase", "both"],
        action: "show",
      },
    },
    {
      name: "description",
      type: "textarea",
      label: t("form.description"),
      placeholder: t("form.descriptionPlaceholder"),
      columnSpan: 12,
    },
  ],
});
