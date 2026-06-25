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
      optionsApi: "/products?all=true&fields=_id,name,unitId,productType,hasExpiry",
      labelInValue: true,
      validation: { minLength: 1 },
    },
    {
      name: "variantId",
      type: "select",
      label: "Variant",
      placeholder: "Select variant",
      columnSpan: 6,
      optionsApi: "/products/{{_id}}/variants?fields=_id,attributes",
      dependsOn: {
        field: "productId",
        condition: "gt",
        action: "disable",
        matchWithProp: "variant_count",
        value: 0
      },
      requiredWhen: {
        field: "productId",
        condition: "gt",
        matchWithProp: "variant_count",
        value: 0,
      },
    },
    {
      name: "quantity",
      type: "number",
      label: "Opening stock",
      placeholder: "0",
      columnSpan: 6,
      validation: { min: 0 },
      helperText: "Quantity currently in stock, in the base unit. Recorded as an opening-stock entry.",
    },
    {
      name: "costPrice",
      type: "number",
      label: "Cost price (per unit)",
      placeholder: "0.00",
      columnSpan: 6,
      validation: { min: 0 },
      helperText: "Unit cost of the opening stock. Used for valuation and the opening-stock report.",
    },
    {
      name: "quantityAlert",
      type: "number",
      label: "Alert Level",
      placeholder: "Enter alert level",
      required: true,
      columnSpan: 6,
      validation: { min: 0 },
      suffix: (values) => {
        const product = (values?.productId ?? null) as any;
        const baseUnit = product?.unit || product?.baseUnit;
        return baseUnit?.shortName || baseUnit?.name || "";
      },
      helperText: (values) => {
        const product = (values?.productId ?? null) as any;
        const baseUnit = product?.unit || product?.baseUnit;
        const baseLabel = baseUnit?.shortName || baseUnit?.name;
        if (!baseLabel) {
          return "Notify when stock falls to or below this level.";
        }
        const purchaseUnit = product?.purchaseUnit;
        const purchaseUnitObj = purchaseUnit?.unitId;
        const purchaseLabel =
          purchaseUnitObj?.shortName || purchaseUnitObj?.name;
        const factor = Number(purchaseUnit?.conversionFactor || 0);
        const parts = [`Alert level is in ${baseLabel}.`];
        if (purchaseLabel && factor > 1) {
          parts.push(`1 ${purchaseLabel} = ${factor} ${baseLabel}.`);
        }
        return parts.join(" ");
      },
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 6,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
    {
      name: "expiryDate",
      type: "date",
      label: "Expiry date",
      columnSpan: 6,
      helperText: "Opening-stock batch expiry. Only applied for expiry-tracked products.",
      dependsOn: { field: "productId", matchWithProp: "hasExpiry", condition: "truthy", action: "show" },
    },
    {
      name: "batchNumber",
      type: "input",
      label: "Batch number",
      placeholder: "Optional",
      columnSpan: 6,
      dependsOn: { field: "productId", matchWithProp: "hasExpiry", condition: "truthy", action: "show" },
    },
  ],
};

export const inventoryDefaultValues = {
  productId: "",
  variantId: "",
  locationId: "",
  quantity: 0,
  costPrice: 0,
  quantityAlert: 0,
  status: "active" as const,
};
