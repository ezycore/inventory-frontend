"use client";

import type { FilterConfig } from "@/types/DataTable";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";

/**
 * Safely get search params — returns null during SSR/prerendering
 * when no Suspense boundary is present.
 */
function useSafeSearchParams(): ReadonlyURLSearchParams | null {
  try {
    return useSearchParams();
  } catch {
    return null;
  }
}

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
  const searchParams = useSafeSearchParams();

  if (!searchParams || !filterConfig?.fields) return {};

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
        // Date range format: startDate,endDate — kept as `YYYY-MM-DD` strings.
        // A `Date` here serialized to a UTC ISO instant, which the API reads as
        // an exact moment and so dropped the whole end day; a picked day is cut
        // on the organization's calendar server-side (CLAUDE.md → Timezones).
        const [start, end] = urlValue.split(",");
        if (start && end) {
          filters[field.name] = { from: start, to: end };
        }
      } else if (field.type === "boolean" || field.type === "checkbox") {
        filters[field.name] = urlValue === "true";
      } else if (field.mode === "multiple") {
        // A multi-select binds to an ARRAY. Handing it the raw string renders
        // the control with nothing selected while the list *is* filtered — the
        // active filter becomes invisible and only Reset can clear it. Comma is
        // the separator the query builder emits for these (`?tags=a,b`).
        filters[field.name] = urlValue.split(",").filter(Boolean);
      } else {
        // text, select, date, etc.
        filters[field.name] = urlValue;
      }
    }
  });

  return filters;
}
