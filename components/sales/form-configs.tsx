// coding-standard: maintained
import { selectOptions } from "@/services/api/select-options";
import type { Translator } from "@/i18n/config";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import {
  accountPaymentOptionItemsCallback,
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
      optionsApi: selectOptions("customers", { fields: "_id,name,defaultDiscountId,email" }),
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
      precision: 2,
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
        // Minimal endpoint, reachable by sales.create as well as
        // accounts.view — a sell-only role would otherwise see no options
        // here at all and be forced to record every sale fully on credit.
        optionsApi: selectOptions("accountPaymentOptions"),
        placeholder: t("selectAccount"),
        itemsCreateCallback: accountPaymentOptionItemsCallback,
        columnSpan: 12,
      },
      {
        name: "paidAmount",
        label: t("paidAmount"),
        type: "number",
        precision: 2,
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
