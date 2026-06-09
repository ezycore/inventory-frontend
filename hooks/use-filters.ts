import { useAuthStore } from "@/services/stores/use-auth-store";
import { FilterField, FilterValues } from "@/types/filter";
import type { DynamicFormConfig } from "@/ui/components/form/type";
import { sanitize } from "@/utils";
import type { ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useFilters(
  fields: FilterField[],
  onApply?: (filters: FilterValues) => void,
  applyOnChange: boolean = false,
  initialValues?: FilterValues,
) {
  // Initialize default values, merged with initialValues if provided
  const getDefaultValues = useCallback(() => {
    const defaults = fields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue ?? "";
      return acc;
    }, {} as FilterValues);
    // Merge with initialValues (URL params take precedence)
    return { ...defaults, ...(initialValues || {}) };
  }, [fields, initialValues]);

  const [values, setValues] = useState<FilterValues>(getDefaultValues());
  const [isOpen, setIsOpen] = useState(false);

  // Update single field
  const updateField = useCallback((name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Apply filters
  const apply = useCallback(() => {
    // Remove empty values
    const activeFilters = Object.entries(values).reduce((acc, [key, value]) => {
      if (value !== "" && value !== null && value !== undefined) {
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
  const clearField = useCallback(
    (name: string) => {
      setValues((prev) => ({
        ...prev,
        [name]: fields.find((f) => f.name === name)?.defaultValue ?? "",
      }));
    },
    [fields],
  );

  // Auto-apply on change
  useEffect(() => {
    if (applyOnChange && onApply) {
      // Remove empty values
      const activeFilters = Object.entries(values).reduce(
        (acc, [key, value]) => {
          if (value !== "" && value !== null && value !== undefined) {
            if (Array.isArray(value) && value.length === 0) {
              return acc;
            }
            acc[key] = value;
          }
          return acc;
        },
        {} as FilterValues,
      );

      onApply(activeFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, applyOnChange]);

  // Get active filter count
  const activeCount = Object.values(values).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== "" && v !== null && v !== undefined;
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
  excludedFields: string[],
): T {
  if (!excludedFields || excludedFields.length === 0) {
    return config;
  }

  // Handle section-based config
  if (config.sections) {
    return {
      ...config,
      sections: config.sections
        .map((section) => ({
          ...section,
          fields: section.fields.filter(
            (field: any) => !excludedFields.includes(field.name),
          ),
        }))
        .filter((section) => section.fields.length > 0),
    };
  }

  // Handle flat fields config
  if (config.fields) {
    return {
      ...config,
      fields: config.fields.filter(
        (field: any) => !excludedFields.includes(field.name),
      ),
    };
  }

  return config;
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
  module: string,
): T {
  const user = useAuthStore((state) => state.user);

  return useMemo(() => {
    const excludedFields = sanitize(
      user?.organization?.settings?.excludedFields?.[module],
      "array",
    );
    if (module === "product") {
      const expiryTrackingEnabled =
        user?.organization?.features?.expiryTracking;
      const uomConversion = user?.organization?.features?.uomConversion;
      const barcodeEnabled = user?.organization?.features?.barcodeSystem;
      if (!expiryTrackingEnabled) {
        // add hasExpiry and expiryAlertDays field name to excludedFields to hide them from form if expiry tracking is enabled
        excludedFields.push("hasExpiry", "expiryAlertDays");
      }
      if (!uomConversion) {
        excludedFields.push(
          "enableUOMConversion",
          "purchaseUnitId",
          "purchaseConversionFactor",
          "saleUnitId",
          "saleConversionFactor",
        );
      }
      if (!barcodeEnabled) {
        excludedFields.push("barcode", "barcodeSymbology");
      }
    }
    return filterFormConfig(formConfig, excludedFields);
  }, [formConfig, user, module]);
}

/**
 * Hook to filter table columns based on excluded columns from settings
 * @param columns - The full column definitions array
 * @param module - The module name (e.g., 'product', 'brand', 'category')
 * @returns Filtered column definitions array
 */
export function useFilteredColumns<T = any>(
  columns: ColumnDef<T>[],
  module: string,
): ColumnDef<T>[] {
  const user = useAuthStore((state) => state.user);

  return useMemo(() => {
    const excludedColumns =
      user?.organization?.settings?.excludedColumns?.[module] || [];
    if (!excludedColumns || excludedColumns.length === 0) {
      return columns;
    }

    return columns.filter((column: any) => {
      const columnKey = column.accessorKey || column.id;
      return !excludedColumns.includes(columnKey);
    });
  }, [columns, user, module]);
}
