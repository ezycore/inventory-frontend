import type { ApiResponse } from "@/types";

export interface ExcludedFieldsSettings {
  product?: string[];
  brand?: string[];
  category?: string[];
  [key: string]: string[] | undefined;
}

export function createOrganizationApi(apiClient: any) {
  return {
    get: (): Promise<ApiResponse<any>> => apiClient.get(`/organization`),

    create: (data: FormData): Promise<ApiResponse<any>> =>
      apiClient.post("/organization", data),

    update: (data: FormData): Promise<ApiResponse<any>> =>
      apiClient.put(`/organization`, data),

    delete: (): Promise<ApiResponse<void>> => apiClient.delete(`/organization`),

    updateFormSettings: (
      data: ExcludedFieldsSettings,
    ): Promise<ApiResponse<{ excludedFields: ExcludedFieldsSettings }>> =>
      apiClient.put(`/organization/form-settings`, data),
  };
}
