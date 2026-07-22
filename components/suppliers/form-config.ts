// coding-standard: maintained
import { selectOptions } from "@/services/api/select-options";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import type { Translator } from "@/i18n/config";

/** `t` is bound to the `suppliers` namespace. */
export function getSupplierFormConfig(t: Translator): DynamicFormConfig {
  return {
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
        name: "email",
        type: "input",
        label: t("form.email"),
        placeholder: t("form.emailPlaceholder"),
        columnSpan: 6,
      },
      {
        name: "phone",
        type: "input",
        label: t("form.phone"),
        placeholder: t("form.phonePlaceholder"),
        columnSpan: 6,
      },
      {
        name: "address",
        type: "textarea",
        label: t("form.address"),
        placeholder: t("form.addressPlaceholder"),
        columnSpan: 12,
      },
      {
        name: "defaultDiscountId",
        type: "select",
        label: t("form.defaultDiscount"),
        placeholder: t("form.defaultDiscountPlaceholder"),
        columnSpan: 6,
        optionsApi: selectOptions("purchaseDiscounts", {
          status: "active",
          fields: "_id,name,value,isDefaultPurchase",
        }),
        defaultFlag: "isDefaultPurchase",
        description: t("form.defaultDiscountHelp"),
        creatable: true,
        quickAddModule: "discount"
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
    ],
  };
}

/**
 * Static English fallback — `config/quickAddConfig.ts` builds its module map at
 * import time (outside React), so it can't call `useTranslations`. The "Add New
 * Supplier" quick-add modal stays English until quickAddConfig itself is
 * converted to a per-render hook (deferred, cross-cuts categories/brands/discounts
 * too — see docs/I18N.md).
 */
export const supplierFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Supplier Name",
      placeholder: "Enter supplier name",
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 100 },
    },
    {
      name: "email",
      type: "input",
      label: "Email",
      placeholder: "Enter email address",
      columnSpan: 6,
    },
    {
      name: "phone",
      type: "input",
      label: "Phone",
      placeholder: "Enter phone number",
      columnSpan: 6,
    },
    {
      name: "address",
      type: "textarea",
      label: "Address",
      placeholder: "Enter address",
      columnSpan: 12,
    },
    {
      name: "defaultDiscountId",
      type: "select",
      label: "Default Discount",
      placeholder: "Select a default discount (optional)",
      columnSpan: 6,
      optionsApi: selectOptions("purchaseDiscounts", {
        status: "active",
        fields: "_id,name,value,isDefaultPurchase",
      }),
      defaultFlag: "isDefaultPurchase",
      description: "Applied automatically to purchases from this supplier",
      creatable: true,
      quickAddModule: "discount"
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
  ],
};
