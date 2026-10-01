import { apiClient } from "@/lib/api-client";
import type { ApiImage } from "@/types/api";
import { resolveFeatureMap } from "@/lib/feature-utils";
import type {
  ApiResponse,
  AvailablePlansInfo,
  OrganizationFeatures,
  PaginatedResponse,
  PlanChangeResult,
  ReferralLinkInfo,
  StorefrontSettings,
  SubscriptionCancelResult,
  SubscriptionInfo,
  SubscriptionStatusInfo,
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
/** Counts behind each risky toggle — advisory input to the disable-confirm. */
export interface FeatureImpact {
  storefront: { pendingOnlineOrders: number };
  expiryTracking: { trackedBatches: number };
  multiLocation: { locations: number };
  /** Both kinds — the `returns` feature gates purchase returns as well. */
  returns: { salesReturns: number; purchaseReturns: number };
}

/** Shared by GET/PUT features and the onboarding endpoint — one shape, one DTO. */
export interface OnboardingState {
  completedAt: string | null;
  /** Where the wizard reopens. Zeroed by "Set up again". */
  step: number;
  /**
   * How many questions have EVER been answered — never walked backwards, so it
   * survives a restart that `step` does not.
   *
   * The wizard pre-fills from this, not from `step`. `featureOverrides` is
   * sparse (absent = "left on"), so an answer can only be read back as far as
   * the merchant demonstrably got; with `step` zeroed by a restart that was
   * nowhere, and re-entry showed eight blank questions over a workspace that
   * still held every answer.
   */
  answeredThrough: number;
}

export interface FeatureState {
  features: OrganizationFeatures;
  planFeatures: OrganizationFeatures;
  /**
   * `{ child: [parents] }` — the backend's `FEATURE_REQUIRES`, on the wire so
   * this side never keeps a second copy of it. A capability whose parent is off
   * is suppressed in `features` and so reads identically to one the merchant
   * switched off; only this table separates them, and only that separation lets
   * a locked switch say "turn Stock back on" instead of offering an upgrade
   * that would change nothing.
   */
  featureRequires: Record<string, string[]>;
  /**
   * The merchant's own explicit disables — sparse, so an absent key means "on".
   *
   * Distinct from `features`, which is DERIVED (plan ceiling ∧ overrides, then
   * the dependency cascade). The setup wizard must read answers back from THIS
   * map: the derived one shows capabilities the cascade suppressed as though
   * the merchant had declined them, and advancing the wizard would then write
   * those back as real choices, destroying the intent it was reading.
   */
  featureOverrides: Partial<OrganizationFeatures>;
  onboarding: OnboardingState;
}

/**
 * Resolve both feature maps in a features response by the backend's rule — a
 * missing key is ON (`resolveFeatureMap`). The endpoints read the organization
 * lean, so keys added after it was written (`purchases`, `inventoryTracking`)
 * arrive absent; the settings page, the wizard and the features cache must not
 * read that as "off" or "not in your plan".
 */
function withResolvedFeatureState<T extends ApiResponse<Partial<FeatureState>>>(
  response: T,
): T {
  const data = response?.data;
  if (!data) return response;
  return {
    ...response,
    data: {
      ...data,
      ...(data.features && { features: resolveFeatureMap(data.features) }),
      ...(data.planFeatures && { planFeatures: resolveFeatureMap(data.planFeatures) }),
    },
  };
}

/**
 * What one wizard step answers with: the feature state, plus the dated VAT
 * registration.
 *
 * The registration cannot be inferred from the flags — `features.tax` is true
 * for standard, reduced and turnover alike — and the wizard writes the auth
 * store from this response, so without it a turnover-tax merchant leaves setup
 * with an empty history and `vatRegistrationOf` resolves them to standard-rated.
 */
export interface OnboardingStepResult extends FeatureState {
  vatRegistrationHistory: VatRegistrationEntry[];
}

/** One step of the setup wizard. Every field is optional because each step
 *  writes a different thing; `complete` is what ends the wizard. */
export interface OnboardingStepPayload {
  step?: number;
  features?: Partial<OrganizationFeatures>;
  vatRegistration?: { type: VatRegistrationType };
  complete?: boolean;
  /**
   * Re-run setup from the start ("Set up again" on Customize workspace).
   *
   * A flag of its own rather than `step: 0`, because the backend's resume point
   * only ever advances — `Math.max`, deliberately, so tapping Back mid-wizard
   * cannot lose ground. That makes a restart inexpressible as an ordinary step
   * write, and an entry point without this would look wired up and do nothing.
   *
   * Touches no feature: the merchant's current setup is what the re-entered
   * wizard pre-fills from.
   */
  restart?: boolean;
}

export const organizationApi = {
  // GET /api/organization - Get organization details
  // Used in: useGetOrganizationApi → organization-tab.tsx
  get: (): Promise<ApiResponse<ApiOrganization>> => apiClient.get(`/organization`),

  // GET /api/organization/subscription - Current plan/entitlement + usage
  // Used in: useGetSubscription → app/(protected)/billing/page.tsx
  getSubscription: (): Promise<ApiResponse<SubscriptionInfo>> =>
    apiClient.get(`/organization/subscription`),

  // GET /api/organization/subscription/status - Minimal, permission-free
  // status (no billing detail). Used in: useGetSubscriptionStatus →
  // components/layout/protected-shell.tsx + billing-alert-banner.tsx, both of which run
  // for every role, not just organization.view holders.
  getSubscriptionStatus: (): Promise<ApiResponse<SubscriptionStatusInfo>> =>
    apiClient.get(`/organization/subscription/status`),

  // GET /api/organization/plans - Available plans (upgrade/downgrade options)
  // Used in: useGetAvailablePlans → billing page
  getPlans: (): Promise<ApiResponse<AvailablePlansInfo>> =>
    apiClient.get(`/organization/plans`),

  // GET /api/organization/billing/pay-link - Live "Pay now" link for an open
  // invoice (past_due). Used in: useRequestPayLink → billing overdue banner.
  getPayLink: (): Promise<
    ApiResponse<{ url: string | null; gateway: string | null; status: string }>
  > => apiClient.get(`/organization/billing/pay-link`),

  // GET /api/organization/referral-link - This workspace's own shareable
  // referral URL (proxied from Mission Control). Used in:
  // useGetReferralLink → settings/referrals page.
  getReferralLink: (): Promise<ApiResponse<ReferralLinkInfo>> =>
    apiClient.get(`/organization/referral-link`),

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
    ApiResponse<FeatureState>
  > =>
    apiClient
      .get<ApiResponse<FeatureState>>(`/organization/features`)
      .then(withResolvedFeatureState),

  // GET /api/organization/features/impact - What switching a feature off hides
  // Used in: the Customize workspace disable-confirm
  getFeatureImpact: (): Promise<ApiResponse<FeatureImpact>> =>
    apiClient.get(`/organization/features/impact`),

  // PUT /api/organization/features - Toggle features within the plan ceiling
  // Used in: settings/features page
  updateFeatures: (
    data: Partial<OrganizationFeatures>,
  ): Promise<
    ApiResponse<FeatureState>
  > =>
    apiClient
      .put<ApiResponse<FeatureState>>(`/organization/features`, data)
      .then(withResolvedFeatureState),

  // POST /api/organization/onboarding - Apply one step of the setup wizard
  // Used in: the onboarding wizard
  applyOnboardingStep: (
    data: OnboardingStepPayload,
  ): Promise<ApiResponse<OnboardingStepResult>> =>
    apiClient
      .post<ApiResponse<OnboardingStepResult>>(`/organization/onboarding`, data)
      .then(withResolvedFeatureState),

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

  // POST /api/organization/storefront/media/image - Upload one image the look
  // embeds (FormData `image`): the announcement background, footer pictures and
  // logos. Returns uploadInfo to put in the Site draft.
  uploadStorefrontImage: (data: FormData): Promise<ApiResponse<ApiImage>> =>
    apiClient.post(`/organization/storefront/media/image`, data),
};
