import type { DynamicFormConfig, FormFieldConfig } from "@/ui/components/form/type";
import {
  supplierItemsCreateCallback,
  productItemsCreateCallback,
  accountItemsCreateCallback,
} from "./helpers";

/**
 * Supplier form configuration (Step 1 - Select Supplier & Purchase Settings)
 */
export const getSupplierFormConfig = (): DynamicFormConfig => {
  const fields: FormFieldConfig[] = [
    {
      name: "supplierId",
      label: "Supplier",
      type: "select",
      required: true,
      optionsApi: "/purchases/suppliers",
      placeholder: "Search or select supplier...",
      labelInValue: true,
      itemsCreateCallback: supplierItemsCreateCallback,
      autoFillFields: ["discountType", "discountValue"],
      columnSpan: 6,
    },
    {
      name: "purchaseType",
      label: "Purchase Type",
      type: "select",
      required: true,
      options: [
        { value: "instant", label: "Instant Purchase (Receive Now)" },
        { value: "order", label: "Create Order (Receive Later)" },
      ],
      columnSpan: 6,
    },
    {
      name: "discountType",
      label: "Discount Type",
      type: "select",
      required: false,
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
    {
      name: "invoiceNumber",
      label: "Invoice Number",
      type: "input",
      required: false,
      placeholder: "Invoice number (optional)",
      columnSpan: 3,
    },
    {
      name: "invoiceDate",
      label: "Invoice Date",
      type: "date",
      required: true,
      columnSpan: 3,
    },
  ];

  return { fields };
};

/**
 * Product form configuration (Step 2 - Add Products to Order)
 */
export const getProductFormConfig = (isUOMEnabled: boolean): DynamicFormConfig => {
  const fields: FormFieldConfig[] = [
    {
      name: "productId",
      label: "Product",
      type: "select",
      required: true,
      optionsApi: "/inventory/purchasable-products",
      placeholder: "Select product",
      labelInValue: true,
      itemsCreateCallback: productItemsCreateCallback,
      columnSpan: 4,
    },
    {
      name: "quantity",
      label: "Purchase Quantity",
      type: "number",
      required: true,
      placeholder: "1",
      columnSpan: 2,
      validation: { min: 1 },
    },
  ];

  // Add UOM converted quantity field if enabled
  if (isUOMEnabled) {
    fields.push({
      name: "convertedQuantity",
      label: "Stock Quantity",
      type: "number",
      required: false,
      disabled: true,
      columnSpan: 2,
      helperText: "Qty × Conversion Factor",
    });
  }

  // Add pricing fields
  fields.push(
    {
      name: "price",
      label: "Total Price",
      type: "number",
      required: true,
      placeholder: "0",
      columnSpan: isUOMEnabled ? 2 : 3,
      validation: { min: 0 },
      disabled: true,
    },
    {
      name: "discount",
      label: "Discount",
      type: "number",
      required: false,
      placeholder: "0",
      columnSpan: isUOMEnabled ? 2 : 3,
      validation: { min: 0 },
    },
    {
      name: "costPrice",
      label: "Cost Price",
      type: "number",
      required: false,
      placeholder: "0",
      columnSpan: isUOMEnabled ? 2 : 2,
      validation: { min: 0 },
    },
    {
      name: "rememberCostPrice",
      label: "Remember Cost Price",
      type: "checkbox",
      required: false,
      columnSpan: isUOMEnabled ? 2 : 2,
    },
  );

  return { fields };
};

/**
 * Payment form configuration (shown in sidebar summary)
 */
export const getPaymentFormConfig = (
  isAccountsEnabled: boolean,
): DynamicFormConfig => {
  const fields: FormFieldConfig[] = [];

  if (isAccountsEnabled) {
    fields.push(
      {
        name: "accountId",
        label: "Payment Account",
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
    placeholder: "Add notes for this purchase (optional)",
    columnSpan: 12,
    rows: 2,
  });

  return { fields };
};
