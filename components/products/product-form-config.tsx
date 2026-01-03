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
            name: "category_id",
            type: "select",
            label: "Category",
            required: true,
            columnSpan: 6,
            placeholder: "Choose category",
            optionsApi: `/categories`,
            creatable: true,
            quickAddModule: "category",
            validation: {
              minLength: 1
            }
          },
          {
            name: "brand_id",
            type: "select",
            label: "Brand",
            columnSpan: 6,
            optionsApi: `/brands`,
            placeholder: "Select brand"
          },
          {
            name: "unit_id",
            type: "select",
            label: "Unit",
            columnSpan: 6,
            optionsApi: `/units`,
            placeholder: "Select unit"
          },
          {
            name: "selling_type",
            type: "select",
            label: "Selling Type",
            required: true,
            columnSpan: 6,
            options: sellingTypeOptions,
            placeholder: "Select selling type",
            defaultValue: "retail"
          },
          {
            name: "tax_type",
            type: "select",
            label: "Tax Type",
            columnSpan: 6,
            options: taxTypeOptions,
            placeholder: "Select",
          },
          {
            name: "tax_id",
            type: "select",
            label: "Tax",
            columnSpan: 6,
            optionsApi: '/taxes',
            placeholder: "Select",
          },
          {
            name: "discount_type",
            type: "select",
            label: "Discount Type",

            columnSpan: 6,
            options: discountTypeOptions,
            placeholder: "Select",
            defaultValue: "fixed",
          },
          {
            name: "discount_value",
            type: "number",
            label: "Discount Value",
            columnSpan: 6,
            placeholder: "0",
            defaultValue: 0,
            validation: { min: 0 },
            step: 0.1,
          },
          // {
          //   name: "has_expiry",
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
          //   name: "expiry_alert_days",
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
            name: "product_type",
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
            showWhen: {
              field: "product_type",
              value: "single"
            }
          },
          {
            name: "cost_price",
            type: "number",
            label: "Cost Price",

            columnSpan: 6,
            placeholder: "0.00",
            defaultValue: 0,
            validation: { min: 0 },
            step: 1,
            showWhen: {
              field: "product_type",
              value: "single"
            }
          },
      
          // Variant Manager custom field - shows when variable product is selected
          {
            name: "variants",
            type: "custom",
            label: "",
            columnSpan: 12,
            customComponent: VariantManager,
            showWhen: {
              field: "product_type",
              value: "variable"
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
            maxFiles: 1,
            maxSize: 5 * 1024 * 1024, // 5MB
            multiple: false,
            showPreview: true,
            dropzoneText: "PNG, JPG, GIF up to 5MB (Max 1 image)",
            validation: {
              max: 1
            },
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