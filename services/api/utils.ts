/**
 * Shared utility functions for API modules
 */

/**
 * Builds query parameters from a filters object
 * Handles object serialization and null/undefined values
 */
export function buildQueryParams(filters: Record<string, any> = {}): string {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (typeof value === "object") {
        params.append(key, JSON.stringify(value));
      } else {
        params.append(key, String(value));
      }
    }
  });

  const paramsString = params.toString();
  return paramsString ? `?${paramsString}` : "";
}

/**
 * Standard filter interface for most list endpoints
 */
export interface BaseFilters {
  page?: number;
  limit?: number;
  status?: "active" | "inactive";
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  [key: string]: any;
}
