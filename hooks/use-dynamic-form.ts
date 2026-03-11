import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import type { DynamicFormConfig, FormFieldConfig } from '@/ui/components/form/type'
import { generateSchemaFromConfig } from '@/ui/components/form/type'

/**
 * Extract default values from form configuration
 */
// Helper to set a nested value in an object by dot-separated path
const setNestedValue = (obj: Record<string, any>, path: string, value: any): void => {
  const keys = path.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {}
    }
    current = current[keys[i]]
  }
  current[keys[keys.length - 1]] = value
}

const extractDefaultValues = (config: DynamicFormConfig): Record<string, any> => {
  const defaults: Record<string, any> = {}

  const processField = (field: FormFieldConfig) => {
    if (field.defaultValue !== undefined) {
      setNestedValue(defaults, field.name, field.defaultValue)
    }
  }

  // Process fields based on config structure
  if (config.fields) {
    config.fields.forEach(processField)
  } else if (config.sections) {
    for (const section of config.sections) {
      section.fields.forEach(processField)
    }
  }

  return defaults
}

/**
 * Custom hook that creates a form with auto-generated schema from config
 * 
 * PERFORMANCE NOTE: To avoid recreating the schema on every render, ensure your config
 * is stable (defined outside component or memoized). The config object reference
 * should not change unless the form structure actually changes.
 * 
 * @param config - The dynamic form configuration (should be stable reference)
 * @param defaultValues - Default form values (will override config defaults)
 * @returns React Hook Form instance with generated schema validation
 */
export const useDynamicForm = <T = any>(
  config: DynamicFormConfig,
  defaultValues?: Partial<T>
) => {
  // Memoize expensive operations
  const schema = useMemo(() => generateSchemaFromConfig(config), [config])
  const configDefaults = useMemo(() => extractDefaultValues(config), [config])
  
  // Merge config defaults with provided defaults (provided defaults take precedence)
  const mergedDefaults = useMemo(() => 
    ({ ...configDefaults, ...defaultValues }), 
    [configDefaults, defaultValues]
  )

  const form = useForm<T>({
    resolver: zodResolver(schema) as any,
    defaultValues: mergedDefaults as any,
  })

  return {
    form,
    schema,
    config
  }
}

export default useDynamicForm