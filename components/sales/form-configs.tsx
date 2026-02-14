import type { DynamicFormConfig } from "@/ui/components/form/type";
import { applyDiscountWithPriority } from "@/utils/discount";
import { ShoppingCart, User } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import {
  accountItemsCreateCallback,
  customerItemsCreateCallback,
  productItemsCreateCallback,
} from "./helpers";

/**
 * Generate customer form configuration
 */
export const getCustomerFormConfig = (
  isAccountsEnabled: boolean,
): DynamicFormConfig => {
  const fields: any[] = [
    {
      name: "customerId",
      label: "Customer",
      type: "select",
      required: false,
      optionsApi: "/sales/customers",
      placeholder: "Select customer (optional)",
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
  ];

  // Add account and payment fields if accounts feature is enabled
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
        columnSpan: 6,
      },
      {
        name: "paidAmount",
        label: "Paid Amount",
        type: "number",
        required: false,
        placeholder: "0",
        columnSpan: 6,
        validation: { min: 0 },
      },
    );
  }

  fields.push({
    name: "notes",
    label: "Notes",
    type: "textarea",
    required: false,
    placeholder: "Add any notes for this sale (optional)",
    columnSpan: 12,
    rows: 2,
  });

  return {
    sections: [
      {
        title: "Customer & Order Discount",
        icon: <User className="h-5 w-5 text-primary" />,
        fields,
      },
    ],
  };
};

/**
 * Generate product form configuration
 */
export const getProductFormConfig = (
  customerForm: UseFormReturn<any>,
  productForm: UseFormReturn<any>,
): DynamicFormConfig => {
  return {
    sections: [
      {
        title: "Add Product",
        icon: <ShoppingCart className="h-5 w-5 text-primary" />,
        fields: [
          {
            name: "productId",
            label: "Product",
            type: "select",
            required: true,
            optionsApi: "/inventory/sellable-products",
            placeholder: "Select product",
            labelInValue: true,
            itemsCreateCallback: productItemsCreateCallback,
            columnSpan: 8,
            // Auto-fill fields when product is selected
            // unitPrice triggers recalculation in handleProductFieldChange
            autoFillFields: ["costPrice", "unitPrice"],
          },
          {
            name: "quantity",
            label: "Quantity",
            type: "number",
            required: true,
            placeholder: "1",
            columnSpan: 3,
            validation: { min: 1 },
          },
          {
            name: "costPrice",
            label: "Cost Price",
            type: "number",
            required: false,
            disabled: true,
            columnSpan: 3,
          },
          {
            name: "unitPrice",
            label: "Unit Price",
            type: "number",
            required: true,
            placeholder: "0",
            columnSpan: 3,
            validation: { min: 0 },
            onChange: (value) => {
              // Recalculate when unit price is manually changed
              const currentDiscountType = customerForm.getValues("discountType");
              const currentDiscountValue =
                customerForm.getValues("discountValue");
              const { discountAmount, salePrice } = applyDiscountWithPriority({
                unitPrice: value as number,
                orderDiscountType: currentDiscountType,
                orderDiscountValue: currentDiscountValue,
              });
              productForm.setValue("discountAmount", discountAmount);
              productForm.setValue("salePrice", salePrice);
            },
          },
          {
            name: "discountAmount",
            label: "Discount",
            type: "number",
            required: false,
            placeholder: "0",
            columnSpan: 3,
            validation: { min: 0 },
            onChange: (value) => {
              // Recalculate sale price when discount is manually changed
              const unitPrice = productForm.getValues("unitPrice");
              const salePrice = Math.max(0, unitPrice - (value as number));
              productForm.setValue("salePrice", salePrice);
            },
          },
          {
            name: "salePrice",
            label: "Sale Price",
            type: "number",
            required: false,
            disabled: true,
            columnSpan: 3,
          },
        ],
      },
    ],
  };
};
