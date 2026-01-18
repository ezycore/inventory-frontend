import { useMemo } from "react"
import { useFieldSettingsStore, filterFormConfig } from "@/stores"
import type { DynamicFormConfig } from "@/ui/components/form/type"

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
  const { getExcludedFieldsForModule } = useFieldSettingsStore()
  const excludedFields = getExcludedFieldsForModule(module)

  return useMemo(() => {
    return filterFormConfig(formConfig, excludedFields)
  }, [formConfig, excludedFields])
}
