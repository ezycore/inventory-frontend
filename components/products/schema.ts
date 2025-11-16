import { ProductStatus, CustomFieldType } from "@/types";
import z from "zod";

// Custom field option schema
const customFieldOptionSchema = z.object({
  label: z.string().min(1, 'Option label is required'),
  value: z.string().min(1, 'Option value is required'),
});

// Custom field validation schema
const customFieldValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  message: z.string().optional(),
}).optional();

// Custom field schema
const customFieldSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Field label is required'),
  type: z.nativeEnum(CustomFieldType),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string())
  ]),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(customFieldOptionSchema).optional(),
  validation: customFieldValidationSchema,
});

// Zod Schema
export const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  category_id: z.string().min(1, 'Category is required'),
  brand_id: z.string().optional(),
  base_sku: z.string().optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(ProductStatus),
  store_id: z.string().optional(),
  warehouse_id: z.string().optional(),
  sub_category_id: z.string().optional(),
  unit_id: z.string().optional(),
  barcode_symbology: z.string().optional(),
  barcode: z.string().optional(),
  selling_type: z.enum(['retail', 'wholesale', 'both']).optional(),
  quantity: z.number().min(0).optional(),
  price: z.number().min(0).optional(),
  tax_type: z.enum(['inclusive', 'exclusive']).optional(),
  tax_id: z.string().optional(),
  discount_type: z.enum(['fixed', 'percentage']).optional(),
  discount_value: z.number().min(0).optional(),
  quantity_alert: z.number().min(0).optional(),
  warranty_id: z.string().optional(),
  manufacturer: z.string().optional(),
  manufactured_date: z.string().optional(),
  expiry_date: z.string().optional(),
  custom_fields: z.array(customFieldSchema).max(10, 'Maximum 10 custom fields allowed').optional(),
})

export { customFieldSchema };