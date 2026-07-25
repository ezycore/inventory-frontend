# Schema-less Dynamic Forms

The dynamic form system now automatically generates Zod schemas from your form configuration, eliminating the need to maintain separate schema files.

## ✨ **Key Benefits**

- ✅ **Single Source of Truth**: All validation rules defined in form config
- ✅ **No Duplicate Code**: Schema generated automatically from config  
- ✅ **Type Safety**: Full TypeScript support with inferred types
- ✅ **Auto-Validation**: Field validation happens automatically
- ✅ **Maintainable**: One place to update field rules and validation

## 🚀 **Usage**

### Simple Form with Generated Schema

```typescript
import { useDynamicForm } from '@/hooks/use-dynamic-form'
import type { DynamicFormConfig } from '@/types/form'

const formConfig: DynamicFormConfig = {
  generateSchema: true, // Enable auto-schema generation
  sections: [
    {
      title: "User Information",
      fields: [
        {
          name: "email",
          type: "input",
          label: "Email",
          required: true,
          validation: {
            email: true,
            minLength: 5,
            maxLength: 255
          }
        },
        {
          name: "age",
          type: "number", 
          zodType: "number",
          label: "Age",
          required: true,
          validation: {
            min: 18,
            max: 120
          }
        }
      ]
    }
  ]
}

// Auto-generates schema and creates form
const { form } = useDynamicForm(formConfig, {
  email: '',
  age: 0
})
```

### Advanced Validation Examples

```typescript
// String with pattern validation
{
  name: "slug",
  type: "input",
  label: "URL Slug", 
  required: true,
  validation: {
    pattern: /^[a-z0-9-]+$/,
    minLength: 3,
    maxLength: 50
  }
}

// Number with min/max.
// The generated schema is z.preprocess(empty → undefined, z.number()…): a
// cleared NumberField emits `null`, which is normalized to "no value" so an
// optional number can be emptied and a required one reports "Price is required".
{
  name: "price",
  type: "number",
  zodType: "number", 
  label: "Price",
  required: true,
  precision: 2,      // declare per field — never defaulted by the renderer
  validation: {
    min: 0,
    max: 999999
  }
}

// File upload with constraints
{
  name: "images",
  type: "file-upload",
  zodType: "array",
  arrayOf: "file",
  label: "Images",
  validation: {
    max: 5 // Max 5 files
  },
  maxFiles: 5,
  maxSize: 5 * 1024 * 1024
}

// Select with enum validation
{
  name: "status", 
  type: "select",
  label: "Status",
  required: true,
  options: [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" }
  ],
  enumValues: ["active", "inactive"] as const
}
```

## 🔧 **Validation Properties**

### String Fields
- `minLength`: Minimum character length
- `maxLength`: Maximum character length  
- `pattern`: RegExp pattern to match
- `email`: Validate as email address
- `url`: Validate as URL

### Number Fields  
- `min`: Minimum numeric value
- `max`: Maximum numeric value

### Array Fields
- `min`: Minimum array length
- `max`: Maximum array length

### Universal
- `required`: Field is required
- `optional`: Field is optional (default: true if not required)
- `custom`: Custom validation function

## 📝 **Generated Schema Types**

The system automatically maps field types to Zod schema types:

| Field Type | Zod Type | Notes |
|------------|----------|-------|
| `input`, `textarea` | `z.string()` | Text validation |
| `number` | `z.number()` | Numeric validation |
| `checkbox` | `z.boolean()` | Boolean validation |
| `select`, `radio-group` | `z.enum()` | Enum validation |
| `file-upload` | `z.array(z.any())` | File array validation |
| `date` | `z.string().pipe(z.coerce.date())` | Date validation |

## 🎯 **Migration from Manual Schema**

**Before (Manual Schema):**
```typescript
// schema.ts
export const productSchema = z.object({
  name: z.string().min(1, 'Name required'),
  price: z.number().min(0, 'Price must be positive'),
  // ... 50+ more fields
})

// form.tsx  
const form = useForm({
  resolver: zodResolver(productSchema),
  defaultValues: { /* values */ }
})
```

**After (Generated Schema):**
```typescript
// form-config.ts
const config = {
  sections: [{
    fields: [
      {
        name: "name",
        type: "input", 
        required: true,
        validation: { minLength: 1 }
      },
      {
        name: "price",
        type: "number",
        zodType: "number",
        required: true, 
        validation: { min: 0 }
      }
    ]
  }]
}

// form.tsx
const { form } = useDynamicForm(config, defaultValues)
```

## 🔥 **Real Example: Product Form**

```typescript
// No more separate schema file needed!
const productConfig = {
  generateSchema: true,
  sections: [
    {
      title: "Product Information",
      fields: [
        {
          name: "name",
          type: "input",
          label: "Product Name",
          required: true,
          validation: { minLength: 1, maxLength: 255 }
        },
        {
          name: "price", 
          type: "number",
          zodType: "number",
          label: "Price",
          required: true,
          validation: { min: 0, max: 999999 }
        },
        {
          name: "images",
          type: "file-upload", 
          zodType: "array",
          arrayOf: "file",
          label: "Images",
          validation: { max: 5 },
          maxFiles: 5
        }
      ]
    }
  ]
}

// Schema auto-generated, form ready to use!
const { form } = useDynamicForm(productConfig, defaultValues)
```

This approach reduces code duplication by ~70% and ensures validation rules never get out of sync! 🎉