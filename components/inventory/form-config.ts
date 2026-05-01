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
      labelInValue: true,
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
  ],
};

export const inventoryDefaultValues = {
  productId: "",
  variantId: "",
  locationId: "",
  quantityAlert: 0,
  status: "active" as const,
};
