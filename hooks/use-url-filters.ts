"use client";

import type { FilterConfig } from "@/types/DataTable";
import { useSearchParams } from "next/navigation";

/**
 * Hook to read initial filter values from URL query parameters.
 * Only reads params that match the filterConfig field names.
 *
 * @param filterConfig - The filter configuration containing field definitions
 * @returns Initial filter values extracted from URL params
 */
export function useUrlFilters(
  filterConfig?: FilterConfig,
): Record<string, any> {
  const searchParams = useSearchParams();

  if (!filterConfig?.fields) return {};

  const filters: Record<string, any> = {};

  filterConfig.fields.forEach((field) => {
    const urlValue = searchParams.get(field.name);
    if (urlValue !== null && urlValue !== "") {
      // Handle different field types
      if (field.type === "number") {
        const numValue = Number(urlValue);
        if (!isNaN(numValue)) {
          filters[field.name] = numValue;
        }
      } else if (field.type === "number-range") {
        // Number range format: min,max
        const [min, max] = urlValue.split(",");
        if (min && max) {
          filters[field.name] = { min: Number(min), max: Number(max) };
        }
      } else if (field.type === "date-range") {
        // Date range format: startDate,endDate
        const [start, end] = urlValue.split(",");
        if (start && end) {
          filters[field.name] = { from: new Date(start), to: new Date(end) };
        }
      } else if (field.type === "boolean" || field.type === "checkbox") {
        filters[field.name] = urlValue === "true";
      } else {
        // text, select, date, etc.
        filters[field.name] = urlValue;
      }
    }
  });

  return filters;
}
