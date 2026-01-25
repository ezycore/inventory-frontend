import { useState, useCallback, useEffect, useMemo } from 'react';
import { FilterField, FilterValues } from '@/types/filter';
import { useAuthStore } from "@/stores/use-auth-store"
import type { DynamicFormConfig } from "@/ui/components/form/type"
import type { ColumnDef } from "@tanstack/react-table"

export function useFilters(
 fields: FilterField[],
 onApply?: (filters: FilterValues) => void,
 applyOnChange: boolean = false
) {
 // Initialize default values
 const getDefaultValues = useCallback(() => {
  return fields.reduce((acc, field) => {
   acc[field.name] = field.defaultValue ?? '';
   return acc;
  }, {} as FilterValues);
 }, [fields]);

 const [values, setValues] = useState<FilterValues>(getDefaultValues());
 const [isOpen, setIsOpen] = useState(false);

 // Update single field
 const updateField = useCallback((name: string, value: any) => {
  setValues(prev => ({ ...prev, [name]: value }));
 }, []);

 // Apply filters
 const apply = useCallback(() => {
  // Remove empty values
  const activeFilters = Object.entries(values).reduce((acc, [key, value]) => {
   if (value !== '' && value !== null && value !== undefined) {
    // Handle arrays (multi-select)
    if (Array.isArray(value) && value.length === 0) {
     return acc;
    }
    acc[key] = value;
   }
   return acc;
  }, {} as FilterValues);

  onApply?.(activeFilters);
  setIsOpen(false);
 }, [values, onApply]);

 // Reset filters
 const reset = useCallback(() => {
  const defaults = getDefaultValues();
  setValues(defaults);
  onApply?.(defaults);
 }, [getDefaultValues, onApply]);

 // Clear single filter
 const clearField = useCallback((name: string) => {
  setValues(prev => ({
   ...prev,
   [name]: fields.find(f => f.name === name)?.defaultValue ?? '',
  }));
 }, [fields]);

 // Auto-apply on change
 useEffect(() => {
  if (applyOnChange && onApply) {
   // Remove empty values
   const activeFilters = Object.entries(values).reduce((acc, [key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
     if (Array.isArray(value) && value.length === 0) {
      return acc;
     }
     acc[key] = value;
    }
    return acc;
   }, {} as FilterValues);

   onApply(activeFilters);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [values, applyOnChange]);

 // Get active filter count
 const activeCount = Object.values(values).filter(v => {
  if (Array.isArray(v)) return v.length > 0;
  return v !== '' && v !== null && v !== undefined;
 }).length;

 return {
  values,
  updateField,
  apply,
  reset,
  clearField,
  activeCount,
  isOpen,
  setIsOpen,
 };
}

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
  const excludedFields = user?.organization?.settings?.excludedFields?.[module] || []

  return useMemo(() => {
    return filterFormConfig(formConfig, excludedFields)
  }, [formConfig, excludedFields])
}

/**
 * Hook to filter table columns based on excluded columns from settings
 * @param columns - The full column definitions array
 * @param module - The module name (e.g., 'product', 'brand', 'category')
 * @returns Filtered column definitions array
 */
export function useFilteredColumns<T = any>(
  columns: ColumnDef<T>[],
  module: string
): ColumnDef<T>[] {
  const user = useAuthStore((state) => state.user)
  const excludedColumns = user?.organization?.settings?.excludedColumns?.[module] || []

  return useMemo(() => {
    if (!excludedColumns || excludedColumns.length === 0) {
      return columns
    }

    return columns.filter((column: any) => {
      const columnKey = column.accessorKey || column.id
      return !excludedColumns.includes(columnKey)
    })
  }, [columns, excludedColumns])
}
