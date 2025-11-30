import { useState, useCallback, useEffect } from 'react';
import { FilterField, FilterValues } from '@/types/filter';

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
