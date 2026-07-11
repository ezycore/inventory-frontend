// coding-standard: maintained
import type { Translator } from "@/i18n/config";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import {
  accountItemsCreateCallback,
  customerItemsCreateCallback,
} from "./helpers";

// Both builders take the caller's `t` bound to "sales.sell.form" (docs/I18N.md).

/**
 * Customer form configuration (Step 1 - Select Customer)
 */
export const getCustomerFormConfig = (t: Translator): DynamicFormConfig => ({
  fields: [
    {
      name: "customerId",
      label: t("customer"),
      type: "select",
      required: true,
      optionsApi: "/sales/customers?all=true&fields=_id,name,defaultDiscountId,email",
      placeholder: t("searchSelectCustomer"),
      itemsCreateCallback: customerItemsCreateCallback,
      labelInValue: true, // To capture both ID and discount metadata
      autoFillFields: ["discountType", "discountValue"], // Auto-fill discount fields based on selected customer
      columnSpan: 6,
      creatable: true,
      quickAddModule: "customer",
    },
    {
      name: "discountValue",
      label: t("discountValue"),
      type: "number",
      required: false,
      placeholder: "0",
      columnSpan: 6,
      validation: { min: 0 },
      suffix: "%",
    },
  ],
});

/**
 * Payment form configuration (shown in sidebar)
 */
export const getPaymentFormConfig = (
  isAccountsEnabled: boolean,
  t: Translator,
): DynamicFormConfig => {
  const fields: any[] = [];

  if (isAccountsEnabled) {
    fields.push(
      {
        name: "accountId",
        label: t("paymentMethod"),
        type: "select",
        required: false,
        optionsApi: "/accounts?all=true&fields=_id,name,isDefault,balance,type,status",
        placeholder: t("selectAccount"),
        itemsCreateCallback: accountItemsCreateCallback,
        columnSpan: 12,
      },
      {
        name: "paidAmount",
        label: t("paidAmount"),
        type: "number",
        required: false,
        placeholder: "0.00",
        columnSpan: 12,
        validation: { min: 0 },
      },
    );
  }

  fields.push({
    name: "notes",
    label: t("notes"),
    type: "textarea",
    required: false,
    placeholder: t("addNotes"),
    columnSpan: 12,
    rows: 2,
  });

  return {
    fields,
  };
};
