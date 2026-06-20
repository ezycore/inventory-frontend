"use client"

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
      title: "Basics",
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
          placeholder: "e.g. Nexum Mups 20mg Capsule",
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
          name: "categoryId",
          type: "select",
          label: "Category",
          required: true,
          columnSpan: 4,
          placeholder: "Choose category",
          optionsApi: `/categories?all=true&fields=_id,name`,
          creatable: true,
          quickAddModule: "category",
        },
        {
          name: "brandId",
          type: "select",
          label: "Brand",
          columnSpan: 4,
          optionsApi: `/brands?all=true&fields=_id,name`,
          placeholder: "Select brand",
          creatable: true,
          quickAddModule: "brand",
        },
        {
          name: "sellingType",
          type: "select",
          label: "Selling type",
          columnSpan: 4,
          options: sellingTypeOptions,
          placeholder: "Select selling type",
          defaultValue: "retail",
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
            { value: 'single', label: 'Single product', description: 'One SKU, one price' },
            { value: 'variable', label: 'Variable product', description: 'Multiple variants (size, color...)' },
          ],
        },
        {
          name: "description",
          type: "textarea",
          label: "Description",
          required: true,
          columnSpan: 12,
          placeholder: "Describe ingredients, usage, benefits, warnings...",
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
          placeholder: "e.g. NEX-020",
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
          label: "Barcode symbology",
          columnSpan: 4,
          defaultValue: "CODE128",
          options: [
            { value: "CODE128", label: "CODE128 (default)" },
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
          label: "This product expires",
          columnSpan: 12,
        },
        {
          name: "expiryAlertDays",
          type: "number",
          label: "Expiry alert days",
          columnSpan: 6,
          placeholder: "0",
          defaultValue: 0,
          tooltip: "How many days before the expiry date the product should start appearing in expiry alerts, so you have time to act on soon-to-expire stock.",
          dependsOn: { field: "hasExpiry", condition: "truthy", action: "show" },
        },
      ],
    },

    // 3. PRICING & TAX --------------------------------------------------------
    {
      title: "Pricing & Tax",
      description: "Set the price and how tax is applied",
      icon: sectionIcon(BadgeDollarSign),
      collapsible: false,
      dependsOn: { field: "productType", value: "single", condition: "eq", action: "show" },
      fields: [
        {
          name: "price",
          type: "custom",
          zodType: "number",
          label: "Selling price",
          columnSpan: 6,
          placeholder: "0.00",
          validation: { min: 0, max: 999999 },
          customComponent: PriceFieldWithUnit,
        },
        {
          name: "taxType",
          type: "select",
          label: "Tax type",
          columnSpan: 3,
          options: taxTypeOptions,
          placeholder: "Select",
          defaultValue: "inclusive",
        },
        {
          name: "taxId",
          type: "select",
          label: "Tax rate",
          columnSpan: 3,
          optionsApi: '/taxes?all=true&fields=_id,name,rate',
          placeholder: "Select tax",
        },
      ],
    },

    // 4. INVENTORY ------------------------------------------------------------
    {
      title: "Inventory",
      description: "Stock levels and low-stock alerts",
      icon: sectionIcon(Boxes),
      collapsible: false,
      // Inventory is only created on initial product creation.
      dependsOn: { field: "_id", condition: "falsy", action: "show" },
      headerAction: ({ control }) => <TrackStockToggle control={control} />,
      fields: [
        {
          name: "locationId",
          type: "select",
          label: "Location",
          columnSpan: 6,
          optionsApi: `/locations?all=true&fields=_id,name`,
          placeholder: "Select location",
          dependsOn: { field: "addToInventory", condition: "truthy", action: "show" },
        },
        // {
        //   name: "openingStock",
        //   type: "number",
        //   zodType: "number",
        //   label: "Opening stock",
        //   columnSpan: 4,
        //   placeholder: "0",
        //   defaultValue: 0,
        //   tooltip: "The quantity currently in stock at this location, entered in the product's base unit. This sets the starting inventory; you can adjust it later from the Inventory page.",
        //   dependsOn: { field: "addToInventory", condition: "truthy", action: "show" },
        // },
        {
          name: "inventoryAlertLevel",
          type: "number",
          zodType: "number",
          label: "Low-stock alert at",
          columnSpan: 6,
          placeholder: "e.g. 20",
          defaultValue: 0,
          tooltip: "When stock falls to or below this number, the product is flagged as low stock and added to your reorder shortlist so you know when to restock.",
          dependsOn: { field: "addToInventory", condition: "truthy", action: "show" },
        },
      ],
    },

    // 5. UNITS OF MEASURE -----------------------------------------------------
    {
      title: "Units of Measure",
      description: "How you count this product when buying and selling",
      icon: sectionIcon(Ruler),
      collapsible: false,
      fields: [
        {
          name: "unitId",
          type: "select",
          label: "Base unit",
          required: true,
          columnSpan: 6,
          optionsApi: `/units?all=true&fields=_id,name,shortName`,
          copyValueTo: ["saleUnit.unitId"],
          placeholder: "Select base unit",
          tooltip: "The unit all stock is counted and reported in (e.g. Piece). Choose carefully — every quantity, including purchases and sales, is recorded in this unit.",
        },
        {
          name: "enableUOMConversion",
          type: "checkbox",
          label: "Buy and sell in different units",
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

    // 6. VARIANTS -------------------------------------------------------------
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

    // 7. MEDIA ----------------------------------------------------------------
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
