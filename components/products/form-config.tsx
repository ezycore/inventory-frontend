import type { DynamicFormConfig } from '@/ui/components/form/type'
import { ProductStatus } from '@/types'
import {
  sellingTypeOptions,
  taxTypeOptions,
} from './product-form-options'
import VariantManager from './variant-manager'
import PriceFieldWithUnit from './price-field-with-unit'
import { NumberInput } from '@/ui/components/numberInput'

// Export as constant instead of function to prevent recreation on every render
export const productFormConfig: DynamicFormConfig = {
  generateSchema: true,
  layout: {
    maxColumns: 12,
    gap: 4,
    sectionSpacing: 6
  },
  sections: [
    {
      title: "Product Information",
      icon: <span className="text-orange-600 font-semibold">ℹ</span>,
      collapsible: true,
      defaultOpen: true,
      fields: [
        {
          name: "name",
          type: "input",
          label: "Product Name",
          required: true,
          columnSpan: 6,
          placeholder: "Enter product name",
          validation: {
            minLength: 1,
            maxLength: 255
          }
        },
        {
          name: 'status',
          type: 'select',
          label: 'Status',
          required: true,
          columnSpan: 6,
          options: [
            { value: ProductStatus.ACTIVE, label: 'Active' },
            { value: ProductStatus.INACTIVE, label: 'Inactive' },
            { value: ProductStatus.ARCHIVED, label: 'Archived' },
          ],
          defaultValue: ProductStatus.ACTIVE,
        },
        {
          name: "categoryId",
          type: "select",
          label: "Category",
          required: true,
          columnSpan: 6,
          placeholder: "Choose category",
          optionsApi: `/categories?all=true&fields=_id,name`,
          creatable: true,
          quickAddModule: "category",
        },
        {
          name: "brandId",
          type: "select",
          label: "Brand",
          columnSpan: 6,
          optionsApi: `/brands?all=true&fields=_id,name`,
          placeholder: "Select brand",
          creatable: true,
          quickAddModule: "brand",
        },
        {
          name: "unitId",
          type: "select",
          label: "Base Unit",
          columnSpan: 6,
          optionsApi: `/units?all=true&fields=_id,name,shortName`,
          copyValueTo: ["saleUnit.unitId"],
          placeholder: "Select base unit",
          helperText: "All inventory will be tracked in this unit"
        },
        {
          name: "sellingType",
          type: "select",
          label: "Selling Type",
          columnSpan: 6,
          options: sellingTypeOptions,
          placeholder: "Select selling type",
          defaultValue: "retail"
        },
        {
          name: "taxType",
          type: "select",
          label: "Tax Type",
          columnSpan: 6,
          options: taxTypeOptions,
          placeholder: "Select",
          defaultValue: "inclusive",
        },
        {
          name: "taxId",
          type: "select",
          label: "Tax",
          columnSpan: 6,
          optionsApi: '/taxes?all=true&fields=_id,name,rate',
          placeholder: "Select",
        },
        {
          name: "hasExpiry",
          type: "checkbox",
          label: "Has Expiry",
          columnSpan: 12,
        },
        {
          name: "expiryAlertDays",
          type: "number",
          label: "Expiry Alert Days",
          columnSpan: 6,
          placeholder: "0",
          defaultValue: 0,
          dependsOn: {
            field: "hasExpiry",
            condition: "truthy",
            action: "show"
          },
        },
        {
          name: "barcode",
          type: "input",
          label: "Barcode",
          columnSpan: 6,
          placeholder: "Scan or type barcode",
          helperText: "Only for Single products. Variable products carry barcodes per-variant. Leave empty to auto-generate.",
          validation: { maxLength: 64 },
          dependsOn: {
            field: "productType",
            value: "single",
            condition: "eq",
            action: "show"
          }
        },
        {
          name: "barcodeSymbology",
          type: "select",
          label: "Symbology",
          columnSpan: 6,
          defaultValue: "CODE128",
          options: [
            { value: "CODE128", label: "CODE128 (default)" },
            { value: "EAN13", label: "EAN-13" },
            { value: "UPC_A", label: "UPC-A" },
            { value: "ITF14", label: "ITF-14" },
            { value: "QR", label: "QR Code" },
          ],
          dependsOn: {
            field: "productType",
            value: "single",
            condition: "eq",
            action: "show"
          }
        },
        {
          name: "description",
          type: "textarea",
          label: "Description",
          columnSpan: 12,
          placeholder: "Describe your product...",
          rows: 4,
          helperText: "Maximum 60 Words"
        }
      ]
    },
    {
      title: "Pricing & Stocks",
      icon: <span className="text-orange-600 font-semibold">$</span>,
      collapsible: true,
      defaultOpen: true,
      fields: [
        {
          name: "productType",
          type: "radio-group",
          label: "Product Type",
          required: true,
          columnSpan: 12,
          defaultValue: "single",
          options: [
            { value: 'single', label: 'Single Product' },
            { value: 'variable', label: 'Variable Product' }
          ]
        },
        // Single product fields - conditional (not required when variable product)
        {
          name: "price",
          type: "custom",
          zodType: "number",
          label: "Price",

          columnSpan: 6,
          placeholder: "0.00",
          validation: { min: 0, max: 999999 },
          // step: 1,
          customComponent: PriceFieldWithUnit,
          dependsOn: {
            field: "productType",
            value: "single",
            condition: "eq",
            action: "show"
          }
        },
        // Variant Manager custom field - shows when variable product is selected
        {
          name: "variants",
          type: "custom",
          label: "",
          columnSpan: 12,
          customComponent: VariantManager,
          dependsOn: {
            field: "productType",
            value: "variable",
            condition: "eq",
            action: "show"
          }
        }
      ]
    },
    {
      title: "UOM Conversion",
      icon: <span className="text-orange-600 font-semibold">📦</span>,
      description: "Configure different units for purchase and sale (e.g., buy in boxes, sell in pieces)",
      collapsible: true,
      defaultOpen: false,
      dependsOn: {
        field: "productType",
        value: "single",
        condition: "eq",
        action: "show",
      },
      // featureFlag: "uomConversion", // Uncomment when feature flag system is ready
      fields: [
        {
          name: "enableUOMConversion",
          type: "checkbox",
          label: "Enable UOM Conversion",
          columnSpan: 12,
          defaultValue: false,
          helperText: "Allow different units for purchase and sale",
        },
        {
          name: "purchaseUnit.unitId",
          type: "select",
          label: "Purchase Unit",
          columnSpan: 6,
          optionsApi: `/units?all=true&fields=_id,name,shortName`, // Fetch all units for selection
          placeholder: "Select purchase unit",
          helperText: "Unit used when purchasing (e.g., Box)",
          dependsOn: {
            field: "enableUOMConversion",
            value: true,
            condition: "eq",
            action: "show"
          }
        },
        {
          name: "purchaseUnit.conversionFactor",
          type: "custom",
          zodType: "number",
          label: "Purchase Conversion Factor",
          columnSpan: 4,
          placeholder: "e.g., 100",
          defaultValue: 1,
          customComponent: NumberInput,
          helperText: "How many base units in 1 purchase unit",
          dependsOn: {
            field: "enableUOMConversion",
            value: true,
            condition: "eq",
            action: "show"
          }
        },
        // {
        //   name: "saleUnit.unitId",
        //   type: "select",
        //   label: "Sale Unit",
        //   columnSpan: 6,
        //   optionsApi: `/units?all=true&fields=_id,name`, // Fetch all units for selection
        //   placeholder: "Select sale unit",
        //   helperText: "Unit used when selling (e.g., Piece)",
        //   dependsOn: {
        //     field: "enableUOMConversion",
        //     value: true,
        //     condition: "eq",
        //     action: "show"
        //   },
        // },
        // {
        //   name: "saleUnit.conversionFactor",
        //   type: "number",
        //   label: "Sale Conversion Factor",
        //   columnSpan: 4,
        //   placeholder: "e.g., 1",
        //   defaultValue: 1,
        //   validation: { min: 0.0001 },
        //   step: 0.01,
        //   helperText: "How many base units in 1 sale unit",
        //   dependsOn: {
        //     field: "enableUOMConversion",
        //     value: true,
        //     condition: "eq",
        //     action: "show"
        //   }
        // }
      ]
    },
    {
      title: "Image",
      icon: <span className="text-orange-600 font-semibold">🖼</span>,
      collapsible: true,
      defaultOpen: true,
      fields: [
        {
          name: "images",
          type: "file-upload",
          zodType: "array",
          arrayOf: "file",
          label: "Product Images",
          columnSpan: 12,
          accept: "image/*",
          maxFiles: 5,
          maxSize: 5 * 1024 * 1024, // 5MB
          showPreview: true,
          dropzoneText: "PNG, JPG, GIF up to 5MB (Max 5 images)"
        }
      ]
    },
    // {
    //   title: "Custom Fields",
    //   icon: <span className="text-orange-600 font-semibold">⚙</span>,
    //   collapsible: true,
    //   defaultOpen: false,
    //   fields: [
    //     {
    //       name: "custom_fields",
    //       type: "custom-fields",
    //       label: "",
    //       columnSpan: 12,
    //       maxCount: 5
    //     }
    //   ]
    // }
  ]
}