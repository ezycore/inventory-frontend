import type { ApiResponse, OrganizationFeatures } from "@/types";

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

    // Feature settings
    getFeatures: (): Promise<ApiResponse<{ features: OrganizationFeatures }>> =>
      apiClient.get(`/organization/features`),

    updateFeatures: (
      data: Partial<OrganizationFeatures>,
    ): Promise<ApiResponse<{ features: OrganizationFeatures }>> =>
      apiClient.put(`/organization/features`, data),
  };
}
