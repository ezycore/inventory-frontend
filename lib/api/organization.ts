import type { ApiResponse, UpdateBrandDto } from "@/types";

export function createOrganizationApi(apiClient: any) {
  return {
    get: (): Promise<ApiResponse<any>> =>
      apiClient.get(`/organization`),

    create: (data: FormData): Promise<ApiResponse<any>> =>
      apiClient.post("/organization", data),

    update: (data: UpdateBrandDto | FormData): Promise<ApiResponse<any>> =>
      apiClient.put(`/organization`, data),

    delete: (): Promise<ApiResponse<void>> =>
      apiClient.delete(`/organization`),

    updateFormSettings: (data: any): Promise<ApiResponse<any>> =>
      apiClient.put(`/organization/form-settings`, data),
  };
}
