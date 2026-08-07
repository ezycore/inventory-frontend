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
      if (Array.isArray(value)) {
        // Repeated key (`?tags=a&tags=b`), which is what the API reads: Express
        // hands a repeated param to Zod as a real array, and the list
        // validators declare `z.union([z.string(), z.array(z.string())])`.
        //
        // These used to fall into the `typeof "object"` branch below and go out
        // as `?tags=["a","b"]`. Nothing decodes that — the backend
        // comma-splits, gets one malformed id, and `new ObjectId(…)` throws. So
        // the request failed, TanStack kept the previous page, and the table
        // showed EVERY row with the filter chip lit: a filter that looks
        // applied and silently is not. Empty arrays drop out entirely (no key),
        // which is the same "no filter" the callers already mean by omitting it.
        value.forEach((item) => {
          if (item !== undefined && item !== null && item !== "") {
            params.append(key, String(item));
          }
        });
      } else if (typeof value === "object") {
        // Non-array objects (a `{ from, to }` date range) keep their JSON
        // encoding — that IS what the date filters on the other side parse.
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
