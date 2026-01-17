import type { ApiResponse } from "@/types";

/**
 * Setup API - For organization and owner setup
 */
export function createSetupApi(apiClient: any) {
 return {
  createOwner: (data: {
   firstName: string;
   lastName: string;
   email: string;
   password: string;
   phone?: string;
   organizationName: string;
   organizationSlug?: string;
   industry: string;
   country: string;
   timezone: string;
   currency: string;
   address?: string;
  }): Promise<ApiResponse<any>> =>
   apiClient.post("/organization", data),
 };
}
