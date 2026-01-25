import type { ApiResponse, OrganizationFeatures } from "@/types";

export interface ExcludedFieldsSettings {
  product?: string[];
  brand?: string[];
  category?: string[];
  [key: string]: string[] | undefined;
}

export interface ExcludedColumnsSettings {
  product?: string[];
  brand?: string[];
  category?: string[];
  [key: string]: string[] | undefined;
}

export function createOrganizationApi(apiClient: any) {
  return {
    get: (): Promise<ApiResponse<any>> => apiClient.get(`/organization`),

    update: (data: FormData): Promise<ApiResponse<any>> =>
      apiClient.put(`/organization`, data),

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
      
    updateColumnSettings: (
      data: ExcludedColumnsSettings,
    ): Promise<ApiResponse<{ excludedColumns: ExcludedColumnsSettings }>> =>
      apiClient.put(`/organization/column-settings`, data),
  };
}
