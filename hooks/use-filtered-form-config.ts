import { useMemo } from "react"
import { useAuthStore } from "@/services/stores/use-auth-store"
import type { DynamicFormConfig } from "@/ui/components/form/type"

/**
 * Utility function to filter form config based on excluded fields
 */
function filterFormConfig<T extends { sections?: any[]; fields?: any[] }>(
  config: T,
  excludedFields: string[]
): T {
  if (!excludedFields || excludedFields.length === 0) {
    return config
  }

  // Handle section-based config
  if (config.sections) {
    return {
      ...config,
      sections: config.sections.map((section) => ({
        ...section,
        fields: section.fields.filter(
          (field: any) => !excludedFields.includes(field.name)
        ),
      })).filter((section) => section.fields.length > 0),
    }
  }

  // Handle flat fields config
  if (config.fields) {
    return {
      ...config,
      fields: config.fields.filter(
        (field: any) => !excludedFields.includes(field.name)
      ),
    }
  }

  return config
}

/**
 * Hook to get a filtered form config based on organization's excluded fields
 * 
 * @param formConfig - The original form configuration
 * @param module - The module name (product, brand, category, etc.)
 * @returns Filtered form config with excluded fields removed
 */
export function useFilteredFormConfig<T extends DynamicFormConfig>(
  formConfig: T,
  module: string
): T {
  const user = useAuthStore((state) => state.user)
  
  const excludedFields = useMemo(
    () => user?.organization?.settings?.excludedFields?.[module] || [],
    [user?.organization?.settings?.excludedFields, module]
  )

  return useMemo(() => {
    return filterFormConfig(formConfig, excludedFields)
  }, [formConfig, excludedFields])
}
