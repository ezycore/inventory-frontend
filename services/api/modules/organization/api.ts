import { apiClient } from "@/lib/api-client";
import type {
  ApiResponse,
  AvailablePlansInfo,
  OrganizationFeatures,
  PaginatedResponse,
  PlanChangeResult,
  StorefrontHeroSlide,
  StorefrontSettings,
  SubscriptionCancelResult,
  SubscriptionInfo,
  UpdateStorefrontSettingsDto,
  VatSettings,
  VatRegistrationEntry,
  VatRegistrationType,
  VatPeriod,
} from "@/types";
import type {
  ApiOrganization,
  NotificationLogItem,
  NotificationSettings,
  SmsTestResult,
  SmsUsageReport,
} from "@/types/api";

/**
 * PATCH body for the notification matrix. `events` is keyed by event key —
 * each key sent REPLACES that event's stored config; keys omitted are left
 * alone. (The backend stores an array internally; the wire shape is keyed.)
 */
export interface UpdateNotificationSettingsDto {
  sms?: {
    enabled?: boolean;
    monthlyCap?: number;
    /** `null` clears the window — an omitted key means "leave it alone". */
    quietHours?: { start: number; end: number } | null;
  };
  merchantRecipients?: {
    email?: string;
    phone?: string;
    alsoNotifyOwner?: boolean;
  };
  events?: Record<
    string,
    {
      customer?: { email?: boolean; sms?: boolean };
      merchant?: { email?: boolean; sms?: boolean };
      templates?: { emailSubject?: string; emailBody?: string; sms?: string };
      schedule?: { hour: number };
    }
  >;
}

export interface NotificationLogParams {
  page?: number;
  limit?: number;
  eventKey?: string;
  channel?: "email" | "sms";
  audience?: "customer" | "merchant";
  status?: string;
  entityId?: string;
}

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
  get: (): Promise<ApiResponse<ApiOrganization>> => apiClient.get(`/organization`),

  // GET /api/organization/subscription - Current plan/entitlement + usage
  // Used in: useGetSubscription → app/(protected)/billing/page.tsx
  getSubscription: (): Promise<ApiResponse<SubscriptionInfo>> =>
    apiClient.get(`/organization/subscription`),

  // GET /api/organization/plans - Available plans (upgrade/downgrade options)
  // Used in: useGetAvailablePlans → billing page
  getPlans: (): Promise<ApiResponse<AvailablePlansInfo>> =>
    apiClient.get(`/organization/plans`),

  // GET /api/organization/billing/pay-link - Live "Pay now" link for an open
  // invoice (past_due). Used in: useRequestPayLink → billing overdue banner.
  getPayLink: (): Promise<
    ApiResponse<{ url: string | null; gateway: string | null; status: string }>
  > => apiClient.get(`/organization/billing/pay-link`),

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

  // POST /api/organization/subscription/cancel - Self-serve at-period-end cancel
  // (or resume with { resume: true }). Used in: useCancelSubscription → billing.
  cancelSubscription: (data: {
    resume?: boolean;
  }): Promise<ApiResponse<SubscriptionCancelResult>> =>
    apiClient.post(`/organization/subscription/cancel`, data),

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

  // GET /api/organization/features - Effective features + plan ceiling
  // Used in: settings/features page
  // `features` = enforced set; `planFeatures` = what the plan grants (ceiling).
  getFeatures: (): Promise<
    ApiResponse<{
      features: OrganizationFeatures;
      planFeatures: OrganizationFeatures;
    }>
  > => apiClient.get(`/organization/features`),

  // PUT /api/organization/features - Toggle features within the plan ceiling
  // Used in: settings/features page
  updateFeatures: (
    data: Partial<OrganizationFeatures>,
  ): Promise<
    ApiResponse<{
      features: OrganizationFeatures;
      planFeatures: OrganizationFeatures;
    }>
  > => apiClient.put(`/organization/features`, data),

  // PUT /api/organization/column-settings - Update table column visibility
  // Used in: Column settings management components
  updateColumnSettings: (
    data: ExcludedColumnsSettings,
  ): Promise<ApiResponse<{ excludedColumns: ExcludedColumnsSettings }>> =>
    apiClient.put(`/organization/column-settings`, data),

  // PUT /api/organization/vat-settings - Update VAT settings and/or append a
  // dated registration change. Used in: VAT settings page.
  //
  // `registration` is appended, never overwritten: the history is what decides
  // every document's VAT treatment and doubles as the audit trail. The server
  // rejects an `effectiveFrom` inside a filed period with `VAT_PERIOD_CLOSED`.
  updateVatSettings: (data: {
    vatSettings?: Partial<VatSettings>;
    registration?: { type: VatRegistrationType; effectiveFrom: string };
  }): Promise<
    ApiResponse<{
      vatSettings?: VatSettings;
      vatRegistrationHistory: VatRegistrationEntry[];
      vatPeriods: VatPeriod[];
    }>
  > => apiClient.put(`/organization/vat-settings`, data),

  // DELETE /api/organization/demo-data - Clear all demo/sample data
  // Used in: useClearDemoData → demo banner "Clear sample data" button
  clearDemoData: (): Promise<ApiResponse<any>> =>
    apiClient.delete(`/organization/demo-data`),

  // ============= Notifications (organization.manage) =============

  // GET /api/organization/notifications - Config + effective event matrix
  getNotificationSettings: (): Promise<ApiResponse<NotificationSettings>> =>
    apiClient.get(`/organization/notifications`),

  // PATCH /api/organization/notifications - Partial config update. `events` is
  // keyed by event key; only the keys sent are replaced.
  updateNotificationSettings: (
    data: UpdateNotificationSettingsDto,
  ): Promise<ApiResponse<NotificationSettings>> =>
    apiClient.patch(`/organization/notifications`, data),

  // POST /api/organization/notifications/sms/test - One real, charged test SMS.
  // `phone` overrides the saved alert number for this send only.
  sendSmsTest: (phone?: string): Promise<ApiResponse<SmsTestResult>> =>
    apiClient.post(`/organization/notifications/sms/test`, phone ? { phone } : {}),

  // GET /api/organization/notifications/log - Outbox/audit rows (paginated)
  getNotificationLog: (
    params?: NotificationLogParams,
  ): Promise<ApiResponse<PaginatedResponse<NotificationLogItem>>> => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params ?? {})) {
      if (value !== undefined && value !== "") qs.append(key, String(value));
    }
    const query = qs.toString();
    return apiClient.get(
      `/organization/notifications/log${query ? `?${query}` : ""}`,
    );
  },

  // POST /api/organization/notifications/log/:id/resend - Dead-letter resend.
  // Only `failed` rows and the two credit skips qualify; the backend rejects
  // the rest rather than silently doing nothing.
  resendNotification: (
    id: string,
  ): Promise<ApiResponse<NotificationLogItem>> =>
    apiClient.post(`/organization/notifications/log/${id}/resend`, {}),

  // GET /api/organization/notifications/sms/usage - Segments by event × month
  getSmsUsage: (months?: number): Promise<ApiResponse<SmsUsageReport>> =>
    apiClient.get(
      `/organization/notifications/sms/usage${months ? `?months=${months}` : ""}`,
    ),

  // ============= Storefront Settings (requires storefront feature) =============

  // GET /api/organization/storefront - Get storefront settings
  getStorefrontSettings: (): Promise<ApiResponse<StorefrontSettings>> =>
    apiClient.get(`/organization/storefront`),

  // PATCH /api/organization/storefront - Update storefront settings / publish
  updateStorefrontSettings: (
    data: UpdateStorefrontSettingsDto,
  ): Promise<ApiResponse<StorefrontSettings>> =>
    apiClient.patch(`/organization/storefront`, data),

  // PATCH /api/organization/storefront/media - Upload/replace/remove logo + banner
  // Accepts FormData with optional `logo`/`banner` files and `removeLogo`/`removeBanner` flags.
  updateStorefrontMedia: (
    data: FormData,
  ): Promise<ApiResponse<StorefrontSettings>> =>
    apiClient.patch(`/organization/storefront/media`, data),

  // POST /api/organization/storefront/media/hero-slide - Upload one storefront
  // image (FormData `image`); returns uploadInfo to embed in a settings PATCH.
  // Shared by hero slides and the announcement-bar background image.
  uploadStorefrontImage: (
    data: FormData,
  ): Promise<ApiResponse<NonNullable<StorefrontHeroSlide["image"]>>> =>
    apiClient.post(`/organization/storefront/media/hero-slide`, data),
};
