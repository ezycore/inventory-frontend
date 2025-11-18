import React from 'react'
import { Plus, Wand2 } from 'lucide-react'
import type { DynamicFormConfig } from '@/types/form'
import { toast } from 'sonner'
import {
  storeOptions,
  warehouseOptions,
  sellingTypeOptions,
  subCategoryOptions,
  unitOptions,
  barcodeSymbologyOptions,
  taxTypeOptions,
  taxOptions,
  discountTypeOptions,
  warrantyOptions,
} from './product-form-options'

export const createProductFormConfig = (
  onNameChange?: (name: string) => void,
  onGenerateBarcode?: () => void
): DynamicFormConfig => {
  return {
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
            name: "store_id",
            type: "select",
            label: "Store",
            columnSpan: 6,
            options: storeOptions,
            placeholder: "Select store"
          },
          {
            name: "warehouse_id", 
            type: "select",
            label: "Warehouse",
            columnSpan: 6,
            options: warehouseOptions,
            placeholder: "Select warehouse"
          },
          {
            name: "name",
            type: "input",
            label: "Product Name",
            required: true,
            columnSpan: 6,
            placeholder: "Enter product name",
            onChange: onNameChange,
            validation: {
              minLength: 1,
              maxLength: 255
            }
          },
          {
            name: "slug",
            type: "input", 
            label: "Slug",
            required: true,
            columnSpan: 6,
            placeholder: "product-slug",
            validation: {
              minLength: 1,
              maxLength: 255,
              pattern: /^[a-z0-9-]+$/
            }
          },
          {
            name: "base_sku",
            type: "input",
            label: "SKU", 
            columnSpan: 6,
            placeholder: "Enter SKU"
          },
          {
            name: "selling_type",
            type: "select",
            label: "Selling Type",
            required: true,
            columnSpan: 6,
            options: sellingTypeOptions,
            placeholder: "Select selling type"
          },
          {
            name: "category_id",
            type: "select",
            label: "Category",
            required: true,
            columnSpan: 6,
            placeholder: "Choose category",
            optionsApi: `/categories`,
            action: {
              icon: <Plus className="h-4 w-4" />,
              label: "Add Category",
              onClick: () => {
                toast.info('Add Category feature coming soon')
              }
            },
            validation: {
              minLength: 1
            }
          },
          {
            name: "sub_category_id",
            type: "select",
            label: "Sub Category",
            columnSpan: 6,
            options: subCategoryOptions,
            placeholder: "Select sub category"
          },
          {
            name: "brand_id",
            type: "select",
            label: "Brand",
            columnSpan: 6,
            optionsApi: `/brands`,
            placeholder: "Select brand",
            onValueChange: (value) => {
              // This will be handled in the product form component
              return value === 'none' ? '' : value
            }
          },
          {
            name: "unit_id",
            type: "select",
            label: "Unit",
            columnSpan: 6,
            options: unitOptions,
            placeholder: "Select unit"
          },
          {
            name: "barcode_symbology",
            type: "select",
            label: "Barcode Symbology",
            columnSpan: 6,
            options: barcodeSymbologyOptions,
            placeholder: "Select symbology"
          },
          {
            name: "barcode",
            type: "input",
            label: "Item Barcode",
            columnSpan: 6,
            placeholder: "Enter barcode",
            action: {
              icon: <Wand2 className="h-4 w-4" />,
              label: "Generate Barcode",
              onClick: onGenerateBarcode
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
            name: "product_type_radio",
            type: "radio-group",
            label: "Product Type",
            required: true,
            columnSpan: 12,
            options: [
              { value: 'single', label: 'Single Product' },
              { value: 'variable', label: 'Variable Product' }
            ]
          },
          // Single product fields - conditional
          {
            name: "quantity",
            type: "number",
            zodType: "number",
            label: "Quantity",
            required: true,
            columnSpan: 4,
            placeholder: "0",
            validation: { min: 0, max: 999999 },
            showWhen: {
              field: "product_type_radio",
              value: "single"
            }
          },
          {
            name: "price", 
            type: "number",
            zodType: "number",
            label: "Price",
            required: true,
            columnSpan: 4,
            placeholder: "0.00",
            validation: { min: 0, max: 999999 },
            step: 0.01,
            showWhen: {
              field: "product_type_radio",
              value: "single"
            }
          },
          {
            name: "tax_type",
            type: "select",
            label: "Tax Type",
            required: true,
            columnSpan: 4,
            options: taxTypeOptions,
            placeholder: "Select",
            showWhen: {
              field: "product_type_radio",
              value: "single"
            }
          },
          {
            name: "tax_id",
            type: "select", 
            label: "Tax",
            required: true,
            columnSpan: 4,
            options: taxOptions,
            placeholder: "Select",
            showWhen: {
              field: "product_type_radio",
              value: "single"
            }
          },
          {
            name: "discount_type",
            type: "select",
            label: "Discount Type", 
            required: true,
            columnSpan: 4,
            options: discountTypeOptions,
            placeholder: "Select",
            showWhen: {
              field: "product_type_radio",
              value: "single"
            }
          },
          {
            name: "discount_value",
            type: "number",
            label: "Discount Value",
            required: true,
            columnSpan: 4,
            placeholder: "0",
            validation: { min: 0 },
            step: 0.01,
            showWhen: {
              field: "product_type_radio",
              value: "single"
            }
          },
          {
            name: "quantity_alert",
            type: "number", 
            label: "Quantity Alert",
            required: true,
            columnSpan: 12,
            placeholder: "10",
            validation: { min: 0 },
            showWhen: {
              field: "product_type_radio",
              value: "single"
            }
          },
          // Variable product message
          {
            name: "variable_message",
            type: "custom",
            label: "",
            columnSpan: 12,
            customComponent: ({ value }: any) => (
              <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
                <p className="text-muted-foreground">
                  Variable product selected. After creating the product, you'll be able to add variants with different attributes, prices, and stock levels.
                </p>
              </div>
            ),
            showWhen: {
              field: "product_type_radio",
              value: "variable"
            }
          }
        ]
      },
      {
        title: "Images",
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
            multiple: true,
            showPreview: true,
            dropzoneText: "PNG, JPG, GIF up to 5MB (Max 5 images)",
            validation: {
              max: 5
            },
            optional: true
          }
        ]
      },
      {
        title: "Custom Fields", 
        icon: <span className="text-orange-600 font-semibold">⚙</span>,
        collapsible: true,
        defaultOpen: false,
        fields: [
          {
            name: "custom_fields",
            type: "custom",
            label: "Custom Fields",
            columnSpan: 12,
            // This will be handled as a custom component
            customComponent: null // Will be set in the product form component
          },
          {
            name: "warranty_id",
            type: "select",
            label: "Warranty",
            columnSpan: 6,
            options: warrantyOptions,
            placeholder: "Select"
          },
          {
            name: "manufacturer",
            type: "input",
            label: "Manufacturer", 
            columnSpan: 6,
            placeholder: "Enter manufacturer"
          },
          {
            name: "manufactured_date",
            type: "date",
            label: "Manufactured Date",
            columnSpan: 6
          },
          {
            name: "expiry_date", 
            type: "date",
            label: "Expiry On",
            columnSpan: 6
          }
        ]
      }
    ]
  }
}