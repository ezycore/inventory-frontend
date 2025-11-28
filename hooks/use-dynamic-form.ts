import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import type { DynamicFormConfig, FormFieldConfig } from '@/ui/components/form/type'
import { generateSchemaFromConfig } from '@/ui/components/form/type'

/**
 * Extract default values from form configuration - optimized version
 */
const extractDefaultValues = (config: DynamicFormConfig): Record<string, any> => {
  const defaults: Record<string, any> = {}
  
  // Single pass through fields with early returns
  const processField = (field: FormFieldConfig) => {
    if (field.defaultValue !== undefined) {
      defaults[field.name] = field.defaultValue
    }
  }
  
  // Process fields efficiently based on structure
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
 * @param config - The dynamic form configuration
 * @param defaultValues - Default form values (will override config defaults)
 * @returns React Hook Form instance with generated schema validation
 */
export const useDynamicForm = <T = any>(
  config: DynamicFormConfig,
  defaultValues?: Partial<T>
) => {
  // Memoize expensive operations to prevent recalculation on re-renders
  const schema = useMemo(() => generateSchemaFromConfig(config), [config])
  const configDefaults = useMemo(() => extractDefaultValues(config), [config])
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