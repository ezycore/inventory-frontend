import type { DynamicFormConfig } from "@/ui/components/form/type";
import {
  accountItemsCreateCallback,
  customerItemsCreateCallback,
} from "./helpers";

/**
 * Customer form configuration (Step 1 - Select Customer)
 */
export const getCustomerFormConfig = (
  isAccountsEnabled: boolean,
): DynamicFormConfig => {
  return {

        fields: [
          {
            name: "customerId",
            label: "Customer",
            type: "select",
            required: false,
            optionsApi: "/sales/customers",
            placeholder: "Search or select customer...",
            labelInValue: true,
            itemsCreateCallback: customerItemsCreateCallback,
            columnSpan: 6,
          },
          {
            name: "discountType",
            label: "Discount Type",
            type: "select",
            required: true,
            options: [
              { value: "percentage", label: "Percentage (%)" },
              { value: "fixed", label: "Fixed Amount" },
            ],
            columnSpan: 3,
          },
          {
            name: "discountValue",
            label: "Discount Value",
            type: "number",
            required: false,
            placeholder: "0",
            columnSpan: 3,
            validation: { min: 0 },
          },
        ],
  };
};

/**
 * Payment form configuration (shown in sidebar)
 */
export const getPaymentFormConfig = (
  isAccountsEnabled: boolean,
): DynamicFormConfig => {
  const fields: any[] = [];

  if (isAccountsEnabled) {
    fields.push(
      {
        name: "accountId",
        label: "Payment Method",
        type: "select",
        required: false,
        optionsApi: "/accounts",
        placeholder: "Select account",
        labelInValue: true,
        itemsCreateCallback: accountItemsCreateCallback,
        columnSpan: 12,
      },
      {
        name: "paidAmount",
        label: "Paid Amount",
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
    label: "Notes",
    type: "textarea",
    required: false,
    placeholder: "Add notes (optional)",
    columnSpan: 12,
    rows: 2,
  });

  return {
        fields,
  
  };
};
