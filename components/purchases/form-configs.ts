// coding-standard: maintained
import { selectOptions } from "@/services/api/select-options";
import { z } from "zod";
import type { DynamicFormConfig, FormFieldConfig } from "@/ui/components/form/type";
import type { Translator } from "@/i18n/config";
import { accountItemsCreateCallback, customerItemsCreateCallback, productItemsCreateCallback } from "../sales";

/**
 * Per-form zod messages (zod v4 ships no bn locale — docs/I18N.md). Callers pass
 * a `purchases.form`-bound translator; the default keeps English for module-level
 * use before a translator exists.
 */
export const makeProductFormSchema = (msg?: {
  productRequired: string;
  quantityMin: string;
}) =>
  z.object({
    productId: z.union([
      z.string().min(1, msg?.productRequired ?? "Product is required"),
      z.object({
        label: z.string(),
        value: z.string(),
        price: z.number().optional(),
        conversionFactor: z.number().optional(),
        productId: z.string().optional(),
        variantId: z.string().nullable().optional(),
        purchaseUnitName: z.string().nullable().optional(),
        unitName: z.string().nullable().optional(),
        // Keep per-line purchase tax on the selected option through zod parsing
        // (z.object strips unknown keys, which would drop the tax otherwise).
        purchaseTaxRate: z.number().optional(),
        purchaseTaxType: z.enum(["inclusive", "exclusive"]).optional(),
      }),
    ]),
    quantity: z.number().min(1, msg?.quantityMin ?? "Quantity must be at least 1"),
    convertedQuantity: z.number().min(0),
    price: z.number().min(0),
    discount: z.number().min(0),
    costPrice: z.number().min(0),
    rememberCostPrice: z.boolean().optional(),
    stock: z.string().optional(),
  });

export const productFormSchema = makeProductFormSchema();

/** Supplier/settings form. `t` is bound to the `purchases` namespace. */
export const getSupplierFormConfig = (t: Translator, isDraft = false): DynamicFormConfig => {
  const fields: FormFieldConfig[] = [
    {
      name: "supplierId",
      label: t("form.supplier"),
      type: "fuseSelect",
      required: true,
      optionsApi: selectOptions("suppliers", { fields: "_id,name,defaultDiscountId" }),
      placeholder: t("form.supplierPlaceholder"),
      labelInValue: true,
      itemsCreateCallback: customerItemsCreateCallback,
      autoFillFields: ["discountValue"],
      columnSpan: 6,
      quickAddModule: "supplier",
      creatable: true,
      ...(isDraft && {
        disabled: true,
        helperText: t("form.draftSupplierHelp"),
      }),
    },
    {
      name: "purchaseType",
      label: t("form.purchaseType"),
      type: "select",
      required: true,
      options: [
        { value: "instant", label: t("form.instantOption") },
        { value: "order", label: t("form.orderOption") },
      ],
      columnSpan: 6,
    },
    {
      name: "discountValue",
      label: t("form.discountValue"),
      type: "number",
      required: false,
      placeholder: "0",
      columnSpan: 6,
      validation: { min: 0 },
      suffix: "%",
    },
    {
      name: "invoiceNumber",
      label: t("form.invoiceNumber"),
      type: "input",
      required: false,
      placeholder: t("form.invoiceNumberPlaceholder"),
      columnSpan: 3,
    },
    {
      name: "invoiceDate",
      label: t("form.invoiceDate"),
      type: "date",
      required: true,
      columnSpan: 3,
    },
  ];

  return { fields };
};

/** Add-product form. `t` is bound to the `purchases` namespace. */
export const getProductFormConfig = (t: Translator, isUOMEnabled: boolean): DynamicFormConfig => {
  const fields: FormFieldConfig[] = [
    {
      name: "productId",
      label: t("form.product"),
      type: "fuseSelect",
      required: true,
      optionsApi: selectOptions("purchasableProducts"),
      placeholder: t("form.productPlaceholder"),
      labelInValue: true,
      itemsCreateCallback: productItemsCreateCallback,
      columnSpan: 4,
    },
    {
      name: "stock",
      label: t("form.stock"),
      type: "input",
      disabled: true,
      placeholder: "1",
      columnSpan: 4,
    },
    {
      name: "purchaseUnitName",
      label: t("form.purchaseUnit"),
      type: "input",
      disabled: true,
      placeholder: "1",
      columnSpan: 4,
      hidden: true,
    },
    {
      name: "quantity",
      label: t("form.purchaseQuantity"),
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
      label: t("form.price"),
      type: "number",
      required: true,
      placeholder: "0",
      columnSpan: 4,
      validation: { min: 0 },
      disabled: true,
    },
    {
      name: "discount",
      label: t("form.discount"),
      type: "number",
      required: false,
      placeholder: "0",
      columnSpan: 4,
      validation: { min: 0 },
    },
    {
      name: "costPrice",
      label: t("form.costPrice"),
      type: "number",
      required: false,
      placeholder: "0",
      columnSpan: 4,
      validation: { min: 0 },
    },
    {
      name: "rememberCostPrice",
      label: t("form.rememberCostPrice"),
      type: "checkbox",
      required: false,
      columnSpan: 12,
    },
  );

  return { fields };
};

/** Payment/notes form. `t` is bound to the `purchases` namespace. */
export const getPaymentFormConfig = (t: Translator, isAccountsEnabled: boolean): DynamicFormConfig => {
  const fields: FormFieldConfig[] = [];

  if (isAccountsEnabled) {
    fields.push(
      {
        name: "accountId",
        label: t("form.paymentAccount"),
        type: "select",
        required: false,
        optionsApi: selectOptions("accounts"),
        placeholder: t("form.selectAccount"),
        labelInValue: true,
        itemsCreateCallback: accountItemsCreateCallback,
        columnSpan: 12,
      },
      {
        name: "paidAmount",
        label: t("form.paidAmount"),
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
    label: t("form.notes"),
    type: "textarea",
    required: false,
    placeholder: t("form.purchaseNotesPlaceholder"),
    columnSpan: 12,
    rows: 2,
  });

  return { fields };
};
