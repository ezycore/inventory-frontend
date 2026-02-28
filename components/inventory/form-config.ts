import { DynamicFormConfig } from "@/ui/components/form/type";

export const inventoryFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "productId",
      type: "select",
      label: "Product",
      placeholder: "Select product",
      required: true,
      columnSpan: 6,
      optionsApi: "/products",
      validation: { minLength: 1 },
    },
    {
      name: "variantId",
      type: "select",
      label: "Variant",
      placeholder: "Select variant",
      columnSpan: 6,
      optionsApi: "/products/{{_id}}/variants",
      dependsOn: {
        field: "productId",
        condition: "gt",
        action: "disable",
        matchWithProp: "variant_count",
        value: 0
      }
    },
    {
      name: "costPrice",
      type: "number",
      label: "Cost Price",
      placeholder: "Enter cost price",
      columnSpan: 6,
      validation: { min: 0 },
    },
    {
      name: "quantity",
      type: "number",
      label: "Quantity",
      placeholder: "Enter quantity",
      columnSpan: 6,
      validation: { min: 0 },
    },
    {
      name: "quantityAlert",
      type: "number",
      label: "Alert Level",
      placeholder: "Enter alert level",
      required: true,
      columnSpan: 6,
      validation: { min: 0 },
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 12,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};

export const inventoryDefaultValues = {
  productId: "",
  variantId: "",
  locationId: "",
  costPrice: 0,
  quantity: 0,
  quantityAlert: 0,
  status: "active" as const,
};
