import type { DynamicFormConfig } from "@/ui/components/form/type";
import {
  accountItemsCreateCallback,
  customerItemsCreateCallback,
} from "./helpers";

/**
 * Customer form configuration (Step 1 - Select Customer)
 */
export const customerFormConfig: DynamicFormConfig = {

  fields: [
    {
      name: "customerId",
      label: "Customer",
      type: "select",
      required: true,
      optionsApi: "/sales/customers?all=true&fields=_id,name,defaultDiscountId",
      placeholder: "Search or select customer...",
      itemsCreateCallback: customerItemsCreateCallback,
      labelInValue: true, // To capture both ID and discount metadata
      autoFillFields: ["discountType", "discountValue"], // Auto-fill discount fields based on selected customer
      columnSpan: 6,
         creatable: true,
          quickAddModule: "customer",
    },
    // {
    //   name: "discountType",
    //   label: "Discount Type (Per Item)",
    //   type: "select",
    //   required: true,
    //   options: [
    //     { value: "percentage", label: "Percentage (%)" },
    //     { value: "fixed", label: "Fixed Amount" },
    //   ],
    //   columnSpan: 4,
    // },
    {
      name: "discountValue",
      label: "Discount Value",
      type: "number",
      required: false,
      placeholder: "0",
      columnSpan: 6,
      validation: { min: 0 },
      suffix: "%"
    }
  ],
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
        optionsApi: "/accounts?all=true&fields=_id,name,isDefault,balance,type,status",
        placeholder: "Select account",
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
