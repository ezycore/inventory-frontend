"use client"
// coding-standard: maintained

import type { DynamicFormConfig } from '@/ui/components/form/type'
import { Controller } from 'react-hook-form'
import {
  Info,
  Barcode,
  BadgeDollarSign,
  Boxes,
  Ruler,
  Layers,
  ImageIcon,
  Percent,
} from 'lucide-react'
import { ProductStatus } from '@/types'
import {
  sellingTypeOptions,
  taxTypeOptions,
} from './product-form-options'
import VariantsField from './variants-field'
import PriceFieldWithUnit from './price-field-with-unit'
import SkuInput from './sku-input'
import { NumberInput } from '@/ui/components/numberInput'
import { Switch } from '@/ui/components/switch'

// Section header toggle that binds to `addToInventory`. Rendered via the
// FormSection.headerAction slot, so it sits on the right of the header.
function TrackStockToggle({ control }: { control: any }) {
  return (
    <Controller
      name="addToInventory"
      control={control}
      render={({ field }) => (
        <label className="flex cursor-pointer items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Track stock</span>
          <Switch
            checked={!!field.value}
            onCheckedChange={field.onChange}
          />
        </label>
      )}
    />
  )
}

const sectionIcon = (Icon: typeof Info) => (
  <Icon className="h-4 w-4 text-orange-600" />
)

// Export as constant instead of function to prevent recreation on every render
export const productFormConfig: DynamicFormConfig = {
  generateSchema: true,
  layout: {
    maxColumns: 12,
    gap: 4,
    sectionSpacing: 6
  },
  sections: [
    // 1. BASICS ---------------------------------------------------------------
    {
      title: "Basic Information",
      description: "The essentials customers will see",
      icon: sectionIcon(Info),
      collapsible: false,
      fields: [
        {
          name: "name",
          type: "input",
          label: "Product name",
          required: true,
          columnSpan: 6,
          placeholder: "Enter product name",
          validation: { minLength: 1, maxLength: 255 },
        },
        {
          name: 'status',
          type: 'select',
          label: 'Status',
          required: true,
          columnSpan: 6,
          options: [
            { value: ProductStatus.ACTIVE, label: 'Active — available for sale' },
            { value: ProductStatus.INACTIVE, label: 'Inactive — hidden from sale' },
            { value: ProductStatus.ARCHIVED, label: 'Archived — kept for records' },
          ],
          defaultValue: ProductStatus.ACTIVE,
        },
        {
          name: "productType",
          type: "radio-group",
          label: "Product type",
          required: true,
          columnSpan: 12,
          defaultValue: "single",
          optionLayout: "cards",
          options: [
            { value: 'single', label: 'Simple product', description: 'One SKU, one price' },
            { value: 'variable', label: 'Variable product', description: 'Multiple variants (size, color...)' },
          ],
        },
        {
          name: "categoryId",
          type: "select",
          label: "Category",
          required: true,
          columnSpan: 6,
          placeholder: "Choose category",
          optionsApi: `/categories?all=true&fields=_id,name,isDefault`,
          defaultFlag: "isDefault",
          creatable: true,
          quickAddModule: "category",
        },
        {
          name: "brandId",
          type: "select",
          label: "Brand",
          columnSpan: 6,
          optionsApi: `/brands?all=true&fields=_id,name,isDefault`,
          defaultFlag: "isDefault",
          placeholder: "Select brand",
          creatable: true,
          quickAddModule: "brand",
        },
        // {
        //   name: "sellingType",
        //   type: "select",
        //   label: "Selling type",
        //   columnSpan: 4,
        //   options: sellingTypeOptions,
        //   placeholder: "Select selling type",
        //   defaultValue: "retail",
        // },
        {
          name: "description",
          type: "textarea",
          label: "Description",
          // required: true,
          columnSpan: 12,
          placeholder: "Enter product description",
          rows: 4,
        },
      ],
    },

    // 2. IDENTIFICATION -------------------------------------------------------
    {
      title: "Identification",
      description: "How this product is recognized in your system",
      icon: sectionIcon(Barcode),
      collapsible: false,
      fields: [
        {
          name: "base_sku",
          type: "custom",
          zodType: "string",
          label: "SKU",
          columnSpan: 4,
          placeholder: "Enter SKU or generate one",
          customComponent: SkuInput,
          tooltip: "An internal code to identify this product in your system (e.g. on labels and reports). Use the wand to generate one from the name, or leave it empty and we'll auto-generate it on save.",
          // Variable products carry a SKU per-variant, so the product-level SKU is single-only.
          dependsOn: { field: "productType", value: "single", condition: "eq", action: "show" },
        },
        {
          name: "barcode",
          type: "input",
          label: "Barcode",
          columnSpan: 4,
          placeholder: "Scan or type barcode",
          tooltip: "The barcode printed on the product packaging. Scan it with a reader or type it in. Leave empty to auto-generate a barcode you can print labels for.",
          validation: { maxLength: 64 },
          dependsOn: { field: "productType", value: "single", condition: "eq", action: "show" },
        },
        {
          name: "barcodeSymbology",
          type: "select",
          label: "Barcode type",
          columnSpan: 4,
          defaultValue: "CODE128",
          options: [
            { value: "CODE128", label: "CODE128" },
            { value: "EAN13", label: "EAN-13" },
            { value: "UPC_A", label: "UPC-A" },
            { value: "ITF14", label: "ITF-14" },
            { value: "QR", label: "QR Code" },
          ],
          dependsOn: { field: "productType", value: "single", condition: "eq", action: "show" },
        },
        {
          name: "hasExpiry",
          type: "checkbox",
          label: "Track expiry dates",
          columnSpan: 12,
          defaultValue: true,
        },
        {
          name: "expiryAlertDays",
          type: "number",
          label: "Expiry alert (days before)",
          columnSpan: 6,
          placeholder: "0",
          defaultValue: 30,
          validation: { min: 0, max: 999999 },
          tooltip: "How many days before the expiry date the product should start appearing in expiry alerts, so you have time to act on soon-to-expire stock.",
          dependsOn: { field: "hasExpiry", condition: "truthy", action: "show" },
        },
      ],
    },

    // 3. UNITS OF MEASURE -----------------------------------------------------
    // Placed before Pricing so the base unit is chosen first — the sell/cost price
    // inputs render it as a "/ unit" suffix.
    {
      title: "Units of Measure",
      description: "How you count this product when purchase and sell",
      icon: sectionIcon(Ruler),
      collapsible: false,
      fields: [
        {
          name: "unitId",
          type: "select",
          label: "Base unit",
          required: true,
          columnSpan: 12,
          optionsApi: `/units?all=true&fields=_id,name,shortName,isDefault`,
          defaultFlag: "isDefault",
          copyValueTo: ["saleUnit.unitId"],
          placeholder: "Select base unit",
          tooltip: "The unit all stock is counted and reported in (e.g. Piece). Choose carefully — every quantity, including purchases and sales, is recorded in this unit.",
        },
        {
          name: "enableUOMConversion",
          type: "checkbox",
          label: "Different purchase & sales units",
          columnSpan: 12,
          defaultValue: false,
          helperText: "e.g. buy in Boxes from supplier, sell in Pieces at the counter.",
          dependsOn: { field: "productType", value: "single", condition: "eq", action: "show" },
        },
        {
          name: "purchaseUnit.unitId",
          type: "select",
          label: "Purchase unit",
          columnSpan: 6,
          optionsApi: `/units?all=true&fields=_id,name,shortName`,
          placeholder: "Select purchase unit",
          tooltip: "The unit you buy this product in (e.g. Box). Stock received in this unit is converted to the base unit using the conversion factor.",
          dependsOn: { field: "enableUOMConversion", value: true, condition: "eq", action: "show" },
        },
        {
          name: "purchaseUnit.conversionFactor",
          type: "custom",
          zodType: "number",
          label: "Purchase conversion factor",
          columnSpan: 6,
          placeholder: "e.g. 100",
          defaultValue: 1,
          customComponent: NumberInput,
          tooltip: "How many base units make up one purchase unit. For example, if you buy in Boxes and 1 box holds 100 pieces, enter 100.",
          dependsOn: { field: "enableUOMConversion", value: true, condition: "eq", action: "show" },
        },
      ],
    },

    // 4. PRICING --------------------------------------------------------------
    // Single-only: variable products carry a sell price per variant (Variants table).
    {
      title: "Pricing",
      description: "Set the sell price",
      icon: sectionIcon(BadgeDollarSign),
      collapsible: false,
      dependsOn: { field: "productType", value: "single", condition: "eq", action: "show" },
      fields: [
        {
          name: "price",
          type: "custom",
          zodType: "number",
          label: "Sell price (per unit)",
          columnSpan: 12,
          placeholder: "0.00",
          validation: { min: 0, max: 999999 },
          customComponent: PriceFieldWithUnit,
        },
      ],
    },

    // 5. TAX ------------------------------------------------------------------
    // No productType gate: tax is product-level (stored on the parent Product) and
    // shared by every variant. Backend reads it from the product, not the variant.
    {
      title: "Tax",
      description: "How tax is applied — shared by all variants",
      icon: sectionIcon(Percent),
      collapsible: false,
      fields: [
        {
          name: "salesTax.taxType",
          type: "select",
          label: "Sales tax calculation",
          columnSpan: 6,
          options: taxTypeOptions,
          placeholder: "Select",
          defaultValue: "inclusive",
        },
        {
          name: "salesTax.taxId",
          type: "select",
          label: "Sales tax rate",
          columnSpan: 6,
          optionsApi: '/taxes?all=true&fields=_id,name,rate,isDefault',
          defaultFlag: "isDefault",
          placeholder: "Select tax",
        },
        {
          name: "purchaseTax.taxType",
          type: "select",
          label: "Purchase tax calculation",
          columnSpan: 6,
          options: taxTypeOptions,
          placeholder: "Select",
          defaultValue: "inclusive",
        },
        {
          name: "purchaseTax.taxId",
          type: "select",
          label: "Purchase tax rate",
          columnSpan: 6,
          optionsApi: '/taxes?all=true&fields=_id,name,rate,isDefault',
          defaultFlag: "isDefault",
          placeholder: "Select tax",
        },
      ],
    },

    // 6. INVENTORY ------------------------------------------------------------
    {
      title: "Inventory",
      description: "Stock levels and low-stock alerts",
      icon: sectionIcon(Boxes),
      collapsible: false,
      // Inventory is only created on initial product creation. Shown for both
      // single and variable products; for variable, only the toggle + shared
      // Location render here — per-variant stock lives in the Variants table.
      dependsOn: { field: "_id", condition: "falsy", action: "show" },
      headerAction: ({ control }) => <TrackStockToggle control={control} />,
      fields: [
        {
          // The visible control is the header toggle above; this hidden field
          // exists only so `addToInventory` is part of the generated zod schema.
          // Without a declared field the schema (z.object) strips the key on
          // submit, so the backend never receives it and skips inventory creation.
          name: "addToInventory",
          type: "checkbox",
          zodType: "boolean",
          label: "",
          hidden: true,
          columnSpan: 12,
          defaultValue: false,
        },
        {
          name: "locationId",
          type: "select",
          label: "Location",
          hidden: true,
          columnSpan: 4,
          optionsApi: `/locations?all=true&fields=_id,name`,
          placeholder: "Select location",
          dependsOn: { field: "addToInventory", condition: "truthy", action: "show" },
        },
        {
          name: "openingStock",
          type: "number",
          zodType: "number",
          label: "Opening stock",
          columnSpan: 4,
          placeholder: "0",
          defaultValue: 0,
          validation: { min: 0 },
          tooltip: "The quantity currently in stock at this location, entered in the product's base unit. Recorded as an opening-stock entry you can report on later; adjust it afterwards from the Inventory page.",
          // Single-only: variable products capture opening stock per variant.
          dependsOn: [
            { field: "addToInventory", condition: "truthy", action: "show" },
            { field: "productType", value: "single", condition: "eq" },
          ],
        },
        {
          name: "costPrice",
          type: "number",
          zodType: "number",
          label: "Cost price (per unit)",
          columnSpan: 4,
          placeholder: "0.00",
          defaultValue: 0,
          tooltip: "Unit cost of the opening stock. Used for inventory valuation and the opening-stock report.",
          dependsOn: [
            { field: "addToInventory", condition: "truthy", action: "show" },
            { field: "productType", value: "single", condition: "eq" },
          ],
        },
        {
          name: "inventoryAlertLevel",
          type: "number",
          zodType: "number",
          label: "Low stock threshold",
          columnSpan: 4,
          placeholder: "e.g. 20",
          // Not `required`: inventory-only field, hidden in edit mode where the product
          // carries no value — a required number would fail zod with `undefined`.
          // `defaultValue: 0` keeps create submitting a value.
          validation: { min: 0 },
          defaultValue: 0,
          tooltip: "When stock falls to or below this number, the product is flagged as low stock and added to your reorder shortlist so you know when to restock.",
          dependsOn: [
            { field: "addToInventory", condition: "truthy", action: "show" },
            { field: "productType", value: "single", condition: "eq" },
          ],
        },
        {
          name: "batchNumber",
          type: "input",
          label: "Batch number",
          columnSpan: 6,
          placeholder: "Optional",
          tooltip: "Batch/lot number for the opening-stock batch. Only applied when expiry tracking is on for this product.",
          dependsOn: [
            { field: "addToInventory", condition: "truthy", action: "show" },
            { field: "productType", value: "single", condition: "eq" },
            { field: "hasExpiry", condition: "truthy" },
            { field: "openingStock", condition: "gt", value: 0 },
          ],
        },
        {
          name: "expiryDate",
          type: "date",
          label: "Opening expiry date",
          columnSpan: 6,
          // Backend wants date-only (YYYY-MM-DD); emit local date to avoid a UTC off-by-one.
          outputFormat: "yyyy-MM-dd",
          tooltip: "Expiry date for the opening-stock batch. Only applied when expiry tracking is on for this product.",
          dependsOn: [
            { field: "addToInventory", condition: "truthy", action: "show" },
            { field: "productType", value: "single", condition: "eq" },
            { field: "hasExpiry", condition: "truthy" },
            { field: "openingStock", condition: "gt", value: 0 },
          ],
        }
      ],
    },

    // 7. VARIANTS -------------------------------------------------------------
    {
      title: "Variants",
      description: "Different sizes, colors, or strengths of this product",
      icon: sectionIcon(Layers),
      collapsible: false,
      fields: [
        {
          name: "variants",
          type: "custom",
          label: "",
          columnSpan: 12,
          customComponent: VariantsField,
        },
      ],
    },

    // 8. MEDIA ----------------------------------------------------------------
    {
      title: "Media",
      description: "Up to 5 images. First image is the primary.",
      icon: sectionIcon(ImageIcon),
      collapsible: false,
      fields: [
        {
          name: "images",
          type: "file-upload",
          zodType: "array",
          arrayOf: "file",
          label: "Product images",
          columnSpan: 12,
          accept: "image/*",
          maxFiles: 5,
          maxSize: 5 * 1024 * 1024, // 5MB
          showPreview: true,
          dropzoneText: "PNG, JPG, WEBP up to 5MB · Max 5 images",
        },
      ],
    },
  ],
}
