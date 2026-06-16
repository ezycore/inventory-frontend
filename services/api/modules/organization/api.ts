import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  AvailablePlansInfo,
  OrganizationFeatures,
  PlanChangeResult,
  SubscriptionInfo,
} from "@/types";

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

/**
 * Organization API - Organization settings and features
 * Backend: /api/organization
 *
 * USAGE MAP:
 * -----------
 * get                  → useGetOrganizationApi (use-organization.ts) → profile/organization-tab.tsx
 * update               → useUpdateOrganization (use-profile.ts) → profile/organization-tab.tsx
 * updateFormSettings   → [Used for form field visibility settings]
 * getFeatures          → [Used for feature flags/toggles]
 * updateFeatures       → [Used for feature flags/toggles]
 * updateColumnSettings → [Used for table column visibility settings]
 */
export const organizationApi = {
  // GET /api/organization - Get organization details
  // Used in: useGetOrganizationApi → organization-tab.tsx
  get: (): Promise<ApiResponse<any>> => apiClient.get(`/organization`),

  // GET /api/organization/subscription - Current plan/entitlement + usage
  // Used in: useGetSubscription → app/(protected)/billing/page.tsx
  getSubscription: (): Promise<ApiResponse<SubscriptionInfo>> =>
    apiClient.get(`/organization/subscription`),

  // GET /api/organization/plans - Available plans (upgrade/downgrade options)
  // Used in: useGetAvailablePlans → billing page
  getPlans: (): Promise<ApiResponse<AvailablePlansInfo>> =>
    apiClient.get(`/organization/plans`),

  // POST /api/organization/plan-change - Self-serve upgrade/downgrade
  // Used in: useRequestPlanChange → billing/available-plans.tsx
  requestPlanChange: (data: {
    planSlug: string;
    returnUrl?: string;
  }): Promise<ApiResponse<PlanChangeResult>> =>
    apiClient.post(`/organization/plan-change`, data),

  // POST /api/organization/plan-change/reconcile - Reconcile a returning checkout
  // Used in: useReconcilePlanChange → billing page (?checkout=success)
  reconcilePlanChange: (data: {
    sessionId: string;
  }): Promise<ApiResponse<unknown>> =>
    apiClient.post(`/organization/plan-change/reconcile`, data),

  // PUT /api/organization - Update organization details
  // Used in: useUpdateOrganization → organization-tab.tsx
  // Accepts FormData (when uploading a logo) or a plain JSON object.
  update: (
    data: FormData | Record<string, any>,
  ): Promise<ApiResponse<any>> => apiClient.put(`/organization`, data),

  // PUT /api/organization/form-settings - Update form field visibility settings
  // Used in: Form field management components
  updateFormSettings: (
    data: ExcludedFieldsSettings,
  ): Promise<ApiResponse<{ excludedFields: ExcludedFieldsSettings }>> =>
    apiClient.put(`/organization/form-settings`, data),

  // ============= Feature Settings =============

  // GET /api/organization/features - Get feature flags
  // Used in: Feature management components
  getFeatures: (): Promise<ApiResponse<{ features: OrganizationFeatures }>> =>
    apiClient.get(`/organization/features`),

  // PUT /api/organization/features - Update feature flags
  // Used in: Feature management components
  updateFeatures: (
    data: Partial<OrganizationFeatures>,
  ): Promise<ApiResponse<{ features: OrganizationFeatures }>> =>
    apiClient.put(`/organization/features`, data),

  // PUT /api/organization/column-settings - Update table column visibility
  // Used in: Column settings management components
  updateColumnSettings: (
    data: ExcludedColumnsSettings,
  ): Promise<ApiResponse<{ excludedColumns: ExcludedColumnsSettings }>> =>
    apiClient.put(`/organization/column-settings`, data),

  // DELETE /api/organization/demo-data - Clear all demo/sample data
  // Used in: useClearDemoData → demo banner "Clear sample data" button
  clearDemoData: (): Promise<ApiResponse<any>> =>
    apiClient.delete(`/organization/demo-data`),
};
