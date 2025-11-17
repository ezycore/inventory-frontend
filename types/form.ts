import { Control } from 'react-hook-form'
import { ReactNode } from 'react'
import { z } from 'zod'

export type FormFieldType = 
  | 'input' 
  | 'textarea' 
  | 'select' 
  | 'select-with-button'
  | 'input-with-button'
  | 'radio-group'
  | 'checkbox'
  | 'file-upload'
  | 'date'
  | 'number'
  | 'custom'

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
  optional?: boolean
  
  // Type-specific properties
  options?: SelectOption[] // For select fields
  rows?: number // For textarea
  accept?: string // For file upload
  maxFiles?: number // For file upload
  maxSize?: number // For file upload (in bytes)
  multiple?: boolean // For file upload and select
  step?: number // For number inputs
  helperText?: string
  
  // File upload specific
  fileTypes?: string[] // Array of allowed file extensions ['jpg', 'png', 'pdf']
  dropzoneText?: string // Custom dropzone text
  showPreview?: boolean // Show file preview (default: true)
  
  // Button properties (for input-with-button, select-with-button)
  buttonIcon?: ReactNode
  buttonLabel?: string
  onButtonClick?: () => void
  
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
  sections: FormSection[]
  layout?: {
    maxColumns?: number // Default grid columns (default: 12)
    gap?: number // Gap between fields
    sectionSpacing?: number // Space between sections
  }
  // Auto-generated schema
  generateSchema?: boolean // Whether to auto-generate Zod schema (default: true)
}

export interface DynamicFormProps {
  config: DynamicFormConfig
  control: Control<any>
  formState: any
  watch: (name?: string | string[]) => any
  setValue: (name: string, value: any) => void
  getValues: (name?: string | string[]) => any
  className?: string
  onFieldChange?: (fieldName: string, value: any) => void
}

// Schema generation utility
export const generateSchemaFromConfig = (config: DynamicFormConfig): z.ZodSchema<any> => {
  const schemaObject: Record<string, z.ZodTypeAny> = {}
  
  config.sections.forEach(section => {
    section.fields.forEach(field => {
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
          if (field.enumValues) {
            fieldSchema = z.enum(field.enumValues as [string, ...string[]])
          } else if (field.options) {
            const values = field.options.map(opt => opt.value) as [string, ...string[]]
            fieldSchema = z.enum(values)
          } else {
            fieldSchema = z.string()
          }
          break
          
        default:
        case 'string':
        case 'input':
        case 'textarea':
        case 'select-with-button':
        case 'input-with-button':
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
            stringSchema = stringSchema.url('Invalid URL')
          }
          fieldSchema = stringSchema
          break
      }
      
      // Handle required/optional
      if (field.required) {
        // Only add required validation for explicit string types that don't already have validation
        const isStringField = (
          (field.type === 'input' || field.type === 'textarea' || field.type === 'input-with-button') 
          && field.zodType !== 'number' 
          && field.zodType !== 'boolean' 
          && field.zodType !== 'array'
          && field.zodType !== 'date'
        )
        
        // Don't add string validation to select fields (they use enums) or fields with existing validation
        if (isStringField && !field.validation?.minLength && !field.options && !field.enumValues) {
          fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} is required`)
        }
      } else if (field.optional !== false) {
        fieldSchema = fieldSchema.optional()
      }
      
      schemaObject[field.name] = fieldSchema
    })
  })
  
  return z.object(schemaObject)
}

// Hook to use generated schema
export const useGeneratedSchema = (config: DynamicFormConfig) => {
  return generateSchemaFromConfig(config)
}