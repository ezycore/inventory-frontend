import type { DynamicFormConfig } from '@/ui/components/form/type'
import { ProductStatus } from '@/types'
import {
  sellingTypeOptions,
  taxTypeOptions,
  discountTypeOptions,
} from './product-form-options'
import VariantManager from './variant-manager'

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
          optionsApi: `/categories`,
          creatable: true,
          quickAddModule: "category",
        },
        {
          name: "brandId",
          type: "select",
          label: "Brand",
          columnSpan: 6,
          optionsApi: `/brands`,
          placeholder: "Select brand",
          creatable: true,
          quickAddModule: "brand",
        },
        {
          name: "unitId",
          type: "select",
          label: "Base Unit",
          columnSpan: 6,
          optionsApi: `/units`,
          placeholder: "Select base unit",
          helperText: "All inventory will be tracked in this unit"
        },
        {
          name: "sellingType",
          type: "select",
          label: "Selling Type",
          required: true,
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
        },
        {
          name: "taxId",
          type: "select",
          label: "Tax",
          columnSpan: 6,
          optionsApi: '/taxes',
          placeholder: "Select",
        },
        {
          name: "discountType",
          type: "select",
          label: "Discount Type",

          columnSpan: 6,
          options: discountTypeOptions,
          placeholder: "Select",
          defaultValue: "fixed",
        },
        {
          name: "discountValue",
          type: "number",
          label: "Discount Value",
          columnSpan: 6,
          placeholder: "0",
          defaultValue: 0,
          validation: { min: 0 },
          step: 0.1,
        },
        // {
        //   name: "hasExpiry",
        //   type: "radio-group",
        //   label: "Has Expiry",
        //   columnSpan: 6,
        //   defaultValue: false,
        //   options: [
        //     { value: true, label: 'Yes' },
        //     { value: false, label: 'No' }
        //   ]
        // },
        // {
        //   name: "expiryAlertDays",
        //   type: "number",
        //   label: "Expiry Alert Days",
        //   columnSpan: 6,
        //   placeholder: "0",
        //   defaultValue: 0,
        //   validation: { min: 0 },
        // },
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
          type: "number",
          zodType: "number",
          label: "Price",

          columnSpan: 6,
          placeholder: "0.00",
          validation: { min: 0, max: 999999 },
          step: 1,
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
      // featureFlag: "uomConversion", // Uncomment when feature flag system is ready
      fields: [
        {
          name: "enableUOMConversion",
          type: "checkbox",
          label: "Enable UOM Conversion",
          columnSpan: 12,
          defaultValue: true,
          helperText: "Allow different units for purchase and sale"
        },
        {
          name: "purchaseUnitId",
          type: "select",
          label: "Purchase Unit",
          columnSpan: 4,
          optionsApi: `/units`,
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
          name: "purchaseConversionFactor",
          type: "number",
          label: "Purchase Conversion Factor",
          columnSpan: 2,
          placeholder: "e.g., 100",
          defaultValue: 1,
          validation: { min: 0.0001 },
          step: 0.01,
          helperText: "How many base units in 1 purchase unit",
          dependsOn: {
            field: "enableUOMConversion",
            value: true,
            condition: "eq",
            action: "show"
          }
        },
        {
          name: "saleUnitId",
          type: "select",
          label: "Sale Unit",
          columnSpan: 4,
          optionsApi: `/units`,
          placeholder: "Select sale unit",
          helperText: "Unit used when selling (e.g., Piece)",
          dependsOn: {
            field: "enableUOMConversion",
            value: true,
            condition: "eq",
            action: "show"
          }
        },
        {
          name: "saleConversionFactor",
          type: "number",
          label: "Sale Conversion Factor",
          columnSpan: 2,
          placeholder: "e.g., 1",
          defaultValue: 1,
          validation: { min: 0.0001 },
          step: 0.01,
          helperText: "How many base units in 1 sale unit",
          dependsOn: {
            field: "enableUOMConversion",
            value: true,
            condition: "eq",
            action: "show"
          }
        }
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