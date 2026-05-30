import { z } from "zod";
import type { DynamicFormConfig, FormFieldConfig } from "@/ui/components/form/type";
import { accountItemsCreateCallback, customerItemsCreateCallback, productItemsCreateCallback } from "../sales";

export const productFormSchema = z.object({
  productId: z.union([
    z.string().min(1, "Product is required"),
    z.object({
      label: z.string(),
      value: z.string(),
      price: z.number().optional(),
      conversionFactor: z.number().optional(),
      productId: z.string().optional(),
      variantId: z.string().nullable().optional(),
      purchaseUnitName: z.string().nullable().optional(),
      unitName: z.string().nullable().optional(),
    }),
  ]),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  convertedQuantity: z.number().min(0),
  price: z.number().min(0),
  discount: z.number().min(0),
  costPrice: z.number().min(0),
  rememberCostPrice: z.boolean().optional(),
  stock: z.string().optional(),
});

export const getSupplierFormConfig = (): DynamicFormConfig => {
  const fields: FormFieldConfig[] = [
    {
      name: "supplierId",
      label: "Supplier",
      type: "fuseSelect",
      required: true,
      optionsApi: "/suppliers?all=true&fields=_id,name,defaultDiscountId",
      placeholder: "Search or select supplier...",
      labelInValue: true,
      itemsCreateCallback: customerItemsCreateCallback,
      autoFillFields: ["discountValue"],
      columnSpan: 6,
      quickAddModule: "supplier",
      creatable: true,
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
      name: "discountValue",
      label: "Discount Value",
      type: "number",
      required: false,
      placeholder: "0",
      columnSpan: 6,
      validation: { min: 0 },
      suffix: "%",
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

export const getProductFormConfig = (isUOMEnabled: boolean): DynamicFormConfig => {
  const fields: FormFieldConfig[] = [
    {
      name: "productId",
      label: "Product",
      type: "fuseSelect",
      required: true,
      optionsApi: "/inventory/purchasable-products",
      placeholder: "Search product by name...",
      labelInValue: true,
      itemsCreateCallback: productItemsCreateCallback,
      columnSpan: 4,
    },
    {
      name: "stock",
      label: "Stock",
      type: "input",
      disabled: true,
      placeholder: "1",
      columnSpan: 4,
    },
    {
      name: "purchaseUnitName",
      label: "Purchase Unit",
      type: "input",
      disabled: true,
      placeholder: "1",
      columnSpan: 4,
      hidden: true,
    },
    {
      name: "quantity",
      label: "Purchase Quantity",
      type: "number",
      required: true,
      placeholder: "1",
      columnSpan: 4,
      validation: { min: 1 },
      suffix: (values: any) => values?.productId?.purchaseUnitName || values?.productId?.unitName || "",
    },
  ];

  fields.push(
    {
      name: "price",
      label: "Price",
      type: "number",
      required: true,
      placeholder: "0",
      columnSpan: 4,
      validation: { min: 0 },
      disabled: true,
    },
    {
      name: "discount",
      label: "Discount",
      type: "number",
      required: false,
      placeholder: "0",
      columnSpan: 4,
      validation: { min: 0 },
    },
    {
      name: "costPrice",
      label: "Cost Price",
      type: "number",
      required: false,
      placeholder: "0",
      columnSpan: 4,
      validation: { min: 0 },
    },
    {
      name: "rememberCostPrice",
      label: "Remember Cost Price",
      type: "checkbox",
      required: false,
      columnSpan: 12,
    },
  );

  return { fields };
};

export const getPaymentFormConfig = (isAccountsEnabled: boolean): DynamicFormConfig => {
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
