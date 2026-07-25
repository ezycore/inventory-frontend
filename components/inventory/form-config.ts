// coding-standard: maintained
import { selectOptions } from "@/services/api/select-options";
import { DynamicFormConfig } from "@/ui/components/form/type";
import type { Translator } from "@/i18n/config";

/** Create/edit form for inventory rows. `t` is bound to the `inventory` namespace. */
export function getInventoryFormConfig(t: Translator): DynamicFormConfig {
  return {
    fields: [
      {
        name: "productId",
        type: "select",
        label: t("form.product"),
        placeholder: t("form.selectProduct"),
        required: true,
        columnSpan: 6,
        optionsApi: selectOptions("products", {
          inventory: false,
          fields: "_id,name,unitId,productType,hasExpiry",
        }),
        labelInValue: true,
        validation: { minLength: 1 },
        // Locked in edit: the inventory row flattens the product name to `name`.
        lockedDisplay: (values) => (values?.name as string) || "—",
      },
      {
        name: "variantId",
        type: "select",
        label: t("form.variant"),
        placeholder: t("form.selectVariant"),
        columnSpan: 6,
        optionsApi: selectOptions("productVariants", {
          inventory: false,
          fields: "_id,attributes",
        }),
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
        // Locked in edit: the row flattens variant attributes to `attributes`.
        lockedDisplay: (values) => {
          const attributes = values?.attributes as Record<string, unknown> | undefined;
          if (!attributes || Object.keys(attributes).length === 0) return "—";
          return Object.entries(attributes)
            .map(([key, value]) => `${key}: ${String(value)}`)
            .join(", ");
        },
      },
      {
        name: "quantityAlert",
        type: "number",
        precision: 0,
        label: t("form.alertLevel"),
        placeholder: t("form.enterAlertLevel"),
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
            return t("form.alertHelpDefault");
          }
          const purchaseUnit = product?.purchaseUnit;
          const purchaseUnitObj = purchaseUnit?.unitId;
          const purchaseLabel =
            purchaseUnitObj?.shortName || purchaseUnitObj?.name;
          const factor = Number(purchaseUnit?.conversionFactor || 0);
          const parts = [t("form.alertHelpBase", { unit: baseLabel })];
          if (purchaseLabel && factor > 1) {
            parts.push(
              t("form.alertHelpConversion", {
                purchaseUnit: purchaseLabel,
                factor,
                unit: baseLabel,
              }),
            );
          }
          return parts.join(" ");
        },
      },
      {
        name: "status",
        type: "select",
        label: t("filters.status"),
        required: true,
        columnSpan: 6,
        options: [
          { value: "active", label: t("filters.active") },
          { value: "inactive", label: t("filters.inactive") },
        ],
      },
      {
        name: "quantity",
        type: "number",
        precision: 0,
        label: t("form.openingStock"),
        placeholder: "0",
        columnSpan: 6,
        hideInEdit: true,
        validation: { min: 0 },
        helperText: t("form.openingStockHelp"),
      },
      {
        name: "costPrice",
        type: "number",
        precision: 2,
        label: t("form.costPrice"),
        placeholder: "0.00",
        columnSpan: 6,
        hideInEdit: true,
        validation: { min: 0 },
        helperText: t("form.costPriceHelp"),
      },
      {
        name: "expiryDate",
        type: "date",
        label: t("form.expiryDate"),
        hideInEdit: true,
        columnSpan: 6,
        helperText: t("form.expiryDateHelp"),
        dependsOn: [
          { field: "productId", matchWithProp: "hasExpiry", condition: "truthy", action: "show" },
          { field: "quantity", condition: "gt", value: 0, action: "show" },
        ],
      },
      {
        name: "batchNumber",
        type: "input",
        label: t("form.batchNumber"),
        hideInEdit: true,
        placeholder: t("form.optionalPlaceholder"),
        columnSpan: 6,
        dependsOn: [
          { field: "productId", matchWithProp: "hasExpiry", condition: "truthy", action: "show" },
          { field: "quantity", condition: "gt", value: 0, action: "show" },
        ],
      },
    ],
  };
}

export const inventoryDefaultValues = {
  productId: "",
  variantId: "",
  locationId: "",
  quantity: 0,
  costPrice: 0,
  quantityAlert: 0,
  status: "active" as const,
};
