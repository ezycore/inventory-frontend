import { Control, UseFormReturn } from 'react-hook-form'
import { ReactNode } from 'react'
import { z } from 'zod'

export type FormFieldType =
  | 'input'
  | 'textarea'
  | 'select'
  | 'radio-group'
  | 'checkbox'
  | 'file-upload'
  | 'date'
  | 'number'
  | 'custom'
  | 'custom-fields'

export type ColumnSpan = 1 | 2 | 3 | 4 | 6 | 12

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface FormFieldConfig {
  // Basic field properties
  name: string
  type: FormFieldType
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  hidden?: boolean
  defaultValue?: any // Default value for the field

  // Layout properties
  columnSpan?: ColumnSpan // Grid columns to span (out of 12)
  className?: string

  // Validation
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: RegExp
    custom?: (value: any) => string | undefined
    email?: boolean
    url?: boolean
  }

  // Schema generation properties
  zodType?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'file'
  arrayOf?: 'string' | 'number' | 'file' | 'any'
  enumValues?: readonly string[]
  // Type-specific properties
  options?: SelectOption[] // For select fields (static options)
  optionsApi?: string      // For select fields (dynamic API-based options) - URL string
  rows?: number // For textarea
  accept?: string // For file upload
  maxFiles?: number // For file upload
  maxSize?: number // For file upload (in bytes)
  multiple?: boolean // For file upload and select
  step?: number // For number inputs
  helperText?: string

  // Multi-select specific properties
  maxCount?: number // Maximum number of selected items
  modalPopover?: boolean // Use modal popover for multi-select
  variant?: 'default' | 'secondary' | 'destructive' | 'inverted' // Multi-select variant

  // File upload specific
  fileTypes?: string[] // Array of allowed file extensions ['jpg', 'png', 'pdf']
  dropzoneText?: string // Custom dropzone text
  showPreview?: boolean // Show file preview (default: true)

  // Advanced select action properties
  action?: {
    icon?: ReactNode
    label?: string
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    disabled?: boolean
    onClick?: (props?: any) => void
    renderItem?: () => ReactNode // Priority: if provided, other props ignored
  }



  // Custom properties
  customComponent?: React.ComponentType<any>
  customProps?: Record<string, any>

  // Conditional display
  showWhen?: {
    field: string
    value: any
    operator?: 'equals' | 'not-equals' | 'includes' | 'not-includes'
  }

  // Change handlers
  onChange?: (value: any) => void
  onValueChange?: (value: any) => void // For select components
}

export interface FormSection {
  title: string
  description?: string
  icon?: ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  fields: FormFieldConfig[]
  className?: string
}

export interface DynamicFormConfig {
  // Either sections OR plain fields - not both
  sections?: FormSection[]
  fields?: FormFieldConfig[]
  layout?: {
    maxColumns?: number // Default grid columns (default: 12)
    gap?: number // Gap between fields
    sectionSpacing?: number // Space between sections
  }
  // Auto-generated schema
  generateSchema?: boolean // Whether to auto-generate Zod schema (default: true)
}

export interface DynamicFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  config: DynamicFormConfig
  form: UseFormReturn<any> // Complete form object from useForm
  className?: string
  onFieldChange?: (fieldName: string, value: any) => void

  // View mode - makes form read-only for viewing data
  viewMode?: boolean

  // Container mode props
  openInside?: 'drawer' | 'modal'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  submitLabel?: string
  cancelLabel?: string
  onSubmit?: (data?: any) => any // Can transform data before submission
  onCancel?: () => void
  isSubmitting?: boolean;
  resetAfterSubmit?: boolean;

  // Mutation-based form submission (alternative to onSubmit)
  mutationHook?: {
    mutate: (data: any, options?: {
      onSuccess?: (result: any) => void
      onError?: (error: any) => void
    }) => void
    isPending: boolean
  } // TanStack Query mutation hook result (e.g., useCreateProduct())
  onSuccess?: (result: any, data: any) => void // Called on successful submission
  onFailed?: (error: any, data: any) => void // Called on submission error

  // Content loading state
  contentLoading?: boolean // Show skeleton instead of form when loading data

  // Modal specific props
  modalSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full'

  // Regular form actions props
  actionsPlacement?: 'top' | 'bottom' | 'both'
}

// Schema generation utility
export const generateSchemaFromConfig = (config: DynamicFormConfig): z.ZodSchema<any> => {
  const schemaObject: Record<string, z.ZodTypeAny> = {}

  // Get all fields - either from sections or plain fields
  const allFields: FormFieldConfig[] = []
  if (config.sections) {
    config.sections.forEach(section => {
      allFields.push(...section.fields)
    })
  } else if (config.fields) {
    allFields.push(...config.fields)
  }

  allFields.forEach(field => {
    let fieldSchema: z.ZodTypeAny

    // Determine base schema type
    switch (field.zodType || field.type) {
      case 'number':
        let numSchema = z.number()
        if (field.validation?.min !== undefined) {
          numSchema = numSchema.min(field.validation.min, `Minimum value is ${field.validation.min}`)
        }
        if (field.validation?.max !== undefined) {
          numSchema = numSchema.max(field.validation.max, `Maximum value is ${field.validation.max}`)
        }
        fieldSchema = numSchema
        break

      case 'boolean':
      case 'checkbox':
        fieldSchema = z.boolean()
        break

      case 'array':
      case 'file-upload':
        let arraySchema: z.ZodArray<any>
        if (field.arrayOf === 'file' || field.type === 'file-upload') {
          arraySchema = z.array(z.any()) // File objects
        } else if (field.arrayOf === 'string') {
          arraySchema = z.array(z.string())
        } else if (field.arrayOf === 'number') {
          arraySchema = z.array(z.number())
        } else {
          arraySchema = z.array(z.any())
        }
        if (field.validation?.min !== undefined) {
          arraySchema = arraySchema.min(field.validation.min, `Minimum ${field.validation.min} items required`)
        }
        if (field.validation?.max !== undefined) {
          arraySchema = arraySchema.max(field.validation.max, `Maximum ${field.validation.max} items allowed`)
        }
        fieldSchema = arraySchema
        break

      case 'date':
        fieldSchema = z.string().pipe(z.coerce.date())
        break

      case 'radio-group':
      case 'select':
        if (field.multiple) {
          // Multi-select should be array of strings
          if (field.enumValues) {
            fieldSchema = z.array(z.enum(field.enumValues as [string, ...string[]]))
          } else if (field.options) {
            const values = field.options.map(opt => opt.value) as [string, ...string[]]
            fieldSchema = z.array(z.enum(values))
          } else {
            fieldSchema = z.array(z.string())
          }
        } else {
          // Single select
          if (field.enumValues) {
            fieldSchema = z.enum(field.enumValues as [string, ...string[]])
          } else if (field.options) {
            const values = field.options.map(opt => opt.value) as [string, ...string[]]
            fieldSchema = z.enum(values)
          } else {
            fieldSchema = z.string()
          }
        }
        break

      case 'custom':
        // Custom fields can contain any type of data (array of field definitions)
        fieldSchema = z.array(z.any()).optional()
        break

      case 'custom-fields':
        // Custom fields array with field definitions and values
        fieldSchema = z.array(z.object({
          name: z.string(),
          type: z.string(),
          value: z.any().optional(),
          label: z.string().optional(),
          placeholder: z.string().optional(),
          required: z.boolean().optional(),
          options: z.array(z.object({
            value: z.string(),
            label: z.string()
          })).optional()
        })).optional()
        break

      default:
      case 'string':
      case 'input':
      case 'textarea':
        let stringSchema = z.string()
        if (field.validation?.minLength !== undefined) {
          stringSchema = stringSchema.min(field.validation.minLength, `Minimum ${field.validation.minLength} characters required`)
        }
        if (field.validation?.maxLength !== undefined) {
          stringSchema = stringSchema.max(field.validation.maxLength, `Maximum ${field.validation.maxLength} characters allowed`)
        }
        if (field.validation?.pattern) {
          stringSchema = stringSchema.regex(field.validation.pattern, 'Invalid format')
        }
        if (field.validation?.email) {
          stringSchema = stringSchema.email('Invalid email address')
        }
        if (field.validation?.url) {
          // Allow empty string or valid URL
          stringSchema = stringSchema.refine(
            (val) => !val || val === '' || z.string().url().safeParse(val).success,
            { message: 'Invalid URL' }
          )
        }
        fieldSchema = stringSchema
        break
    }

    // Handle required/optional
    if (field.required) {
      // Only add required validation for explicit string types that don't already have validation
      const isStringField = (
        (field.type === 'input' || field.type === 'textarea')
        && field.zodType !== 'number'
        && field.zodType !== 'boolean'
        && field.zodType !== 'array'
        && field.zodType !== 'date'
      )

      // Don't add string validation to select fields (they use enums) or fields with existing validation
      if (isStringField && !field.validation?.minLength && !field.options && !field.enumValues) {
        fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} is required`)
      }
    } else if (!field.required) {
      fieldSchema = fieldSchema.optional()
    }

    schemaObject[field.name] = fieldSchema
  })

  return z.object(schemaObject)
}

// Hook to use generated schema
export const useGeneratedSchema = (config: DynamicFormConfig) => {
  return generateSchemaFromConfig(config)
}