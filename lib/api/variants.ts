import type { ApiResponse, PaginatedResponse, CreateVariantDto, UpdateVariantDto, VariantFilters } from "@/types";
import { buildQueryParams, type BaseFilters } from "./utils";

/**
 * Process variant data before sending to API
 * Handles both variant instances and attribute templates
 * Converts values string to array for attributes
 */
function processData(data: any): any {
  if (data instanceof FormData) {
    const formData = new FormData();
    for (const [key, value] of data.entries()) {
      if (key === "values") {
        // Convert comma-separated string to array (for variant attributes)
        const valuesArray =
          typeof value === "string"
            ? value
              .split(",")
              .map((v: string) => v.trim())
              .filter((v: string) => v)
            : value;
        formData.append(key, JSON.stringify(valuesArray));
      } else {
        formData.append(key, value);
      }
    }
    return formData;
  } else {
    // Plain object
    return {
      ...data,
      values:
        typeof data.values === "string"
          ? data.values
            .split(",")
            .map((v: string) => v.trim())
            .filter((v: string) => v)
          : data.values,
    };
  }
}

/**
 * Transform variant data for editing
 * Converts values array to comma-separated string (for variant attributes)
 */
function transformForEdit(item: any): any {
  return {
    ...item,
    values: Array.isArray(item.values) ? item.values.join(", ") : item.values,
  };
}

export function createVariantsApi(apiClient: any) {
  return {
    // Utility methods for variant attributes
    processData,
    transformForEdit,

    // Query methods
    getAll: (filters: VariantFilters | BaseFilters = {}): Promise<ApiResponse<PaginatedResponse<any>>> =>
      apiClient.get(`/variants${buildQueryParams(filters)}`),

    getById: (id: string): Promise<ApiResponse<any>> =>
      apiClient.get(`/variants/${id}`),

    getByProduct: (productId: string): Promise<ApiResponse<PaginatedResponse<any>>> =>
      apiClient.get(`/variants?productId=${productId}`),

    getLowStock: (): Promise<ApiResponse<PaginatedResponse<any>>> =>
      apiClient.get("/variants/low-stock"),

    getStats: (productId?: string): Promise<ApiResponse<any>> =>
      apiClient.get(`/variants/stats${productId ? `?productId=${productId}` : ""}`),

    // Mutation methods with data processing
    create: (data: CreateVariantDto | any): Promise<ApiResponse<any>> => {
      const processedData = data.values ? processData(data) : data;
      return apiClient.post("/variants", processedData);
    },

    update: (id: string, data: UpdateVariantDto | any): Promise<ApiResponse<any>> => {
      const processedData = data.values ? processData(data) : data;
      return apiClient.put(`/variants/${id}`, processedData);
    },

    delete: (id: string): Promise<ApiResponse<void>> =>
      apiClient.delete(`/variants/${id}`),
  };
}
