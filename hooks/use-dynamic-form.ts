import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { DynamicFormConfig } from '@/types/form'
import { generateSchemaFromConfig } from '@/types/form'

/**
 * Custom hook that creates a form with auto-generated schema from config
 * @param config - The dynamic form configuration
 * @param defaultValues - Default form values
 * @returns React Hook Form instance with generated schema validation
 */
export const useDynamicForm = <T = any>(
  config: DynamicFormConfig,
  defaultValues?: Partial<T>
) => {
  const schema = generateSchemaFromConfig(config)
  
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  })

  return {
    form,
    schema,
    config
  }
}

export default useDynamicForm