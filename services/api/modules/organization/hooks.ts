import { invalidate } from "@/services/api/invalidation";
import { queryKeys } from "@/services/api/query-keys";
import {
  ExcludedColumnsSettings,
  ExcludedFieldsSettings,
  organizationApi,
} from "@/services/api";
import type {
  NotificationLogParams,
  OnboardingStepPayload,
  UpdateNotificationSettingsDto,
} from "./api";
import type {
  ApiResponse,
  OrganizationFeatures,
  PlanChangeResult,
  SubscriptionCancelResult,
  SubscriptionInfo,
  UpdateStorefrontSettingsDto,
  VatSettings,
  VatRegistrationType,
} from "@/types";
import type { ReceiptSettings } from "@/types/receipt";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { revalidateStorefront } from "@/lib/revalidate-storefront";
import { handleMutationSuccess } from "../query-helpers";
import { useAuthStore } from "@/services/stores/use-auth-store";

// GET /api/organization - Get organization details
export const useGetOrganizationApi = () => {
  return useQuery({
    queryKey: queryKeys.organization.all(),
    queryFn: () => organizationApi.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// GET /api/organization/notifications - Config + effective event matrix
export const useNotificationSettings = () =>
  useQuery({
    queryKey: queryKeys.organization.notifications(),
    queryFn: () => organizationApi.getNotificationSettings(),
    select: (res) => res.data,
    staleTime: 60 * 1000,
  });

// PATCH /api/organization/notifications - Partial config update
export const useUpdateNotificationSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateNotificationSettingsDto) =>
      organizationApi.updateNotificationSettings(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Notification settings updated");
      // The PATCH answers with the full effective matrix, so seed the cache
      // with it instead of refetching.
      queryClient.setQueryData(queryKeys.organization.notifications(), result);
    },
    onError: handleMutationError,
  });
};

/**
 * POST /api/organization/notifications/sms/test — send one real, charged SMS.
 *
 * A `failed` verdict comes back as a SUCCESSFUL response carrying the
 * gateway's own words, so it is not routed to `handleMutationError`: the
 * rejection reason is the diagnostic the merchant pressed the button for, and
 * a generic red toast would throw it away. The caller renders the verdict.
 *
 * The settings query is invalidated either way — the balance moved on a send,
 * and the log gained a row in every case.
 */
export const useSendSmsTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (phone?: string) => organizationApi.sendSmsTest(phone),
    // One prefix covers both: `notificationLog` keys start with the
    // `notifications` key, so this flushes the settings AND every filtered
    // page of the log.
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organization.notifications(),
      });
    },
    onError: handleMutationError,
  });
};

// GET /api/organization/notifications/log - Outbox/audit rows
export const useNotificationLog = (params?: NotificationLogParams) =>
  useQuery({
    queryKey: queryKeys.organization.notificationLog(params),
    queryFn: () => organizationApi.getNotificationLog(params),
    select: (res) => res.data,
    // `page`/`status`/`channel` are all in the key, so every paging or filter
    // change is a cache miss and `isLoading` goes true — the log collapses to a
    // spinner and re-appears. Keep the previous rows up while the next load
    // settles. See the paginated-list rule in the query-cache skill.
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

/**
 * POST /api/organization/notifications/log/:id/resend — dead-letter resend.
 *
 * Invalidates the whole `notifications` prefix rather than patching the row in
 * place: an SMS resend also moves the balance, and the settings card sitting
 * above the log shows that balance.
 */
export const useResendNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => organizationApi.resendNotification(id),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Queued to send again");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.organization.notifications(),
      });
    },
    onError: handleMutationError,
  });
};

// GET /api/organization/notifications/sms/usage - Segments by event × month
export const useSmsUsage = (months?: number, enabled = true) =>
  useQuery({
    queryKey: queryKeys.organization.smsUsage(months),
    queryFn: () => organizationApi.getSmsUsage(months),
    select: (res) => res.data,
    staleTime: 60 * 1000,
    enabled,
  });

// GET /api/organization/subscription - Current plan/entitlement + usage.
// Backend requires `organization.view`; a user without it fired this 403 on
// every mount of the protected layout, so `enabled` defaults to true but
// callers that know the viewer's permissions (the layout) should pass false.
export const useGetSubscription = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.organization.subscription(),
    queryFn: () => organizationApi.getSubscription(),
    select: (res) => res.data,
    staleTime: 60 * 1000, // 1 minute
    enabled,
  });
};

// GET /api/organization/subscription/status - Minimal, permission-free
// subscription status. Unconditionally enabled (unlike useGetSubscription
// above) — the backend route carries no checkPermission, so there is no
// role this 403s for. Used by the protected layout's workspace-access gate
// and by BillingAlertBanner, both of which must work for every role.
export const useGetSubscriptionStatus = () => {
  return useQuery({
    queryKey: queryKeys.organization.subscriptionStatus(),
    queryFn: () => organizationApi.getSubscriptionStatus(),
    select: (res) => res.data,
    staleTime: 60 * 1000, // 1 minute
  });
};

// GET /api/organization/billing/pay-link - Resolve a live "Pay now" link on
// demand (lazy: fired from the overdue banner, not on page load).
export const useRequestPayLink = () =>
  useMutation({
    mutationFn: () => organizationApi.getPayLink(),
    onError: handleMutationError,
  });

// GET /api/organization/plans - Available plans (upgrade/downgrade options)
export const useGetAvailablePlans = () => {
  return useQuery({
    queryKey: queryKeys.organization.plans(),
    queryFn: () => organizationApi.getPlans(),
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// GET /api/organization/referral-link - This workspace's own shareable
// referral URL. `null` (MC unreachable/unconfigured) is the ordinary
// degraded case — the page should hide the section, not show an error.
export const useGetReferralLink = () => {
  return useQuery({
    queryKey: queryKeys.organization.referralLink(),
    queryFn: () => organizationApi.getReferralLink(),
    select: (res) => res.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// POST /api/organization/plan-change - Self-serve upgrade/downgrade.
// Returns MC's discriminated result; the caller decides what to do (redirect to
// checkout / toast a scheduled downgrade / refresh after immediate activation).
export const useRequestPlanChange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { planSlug: string; returnUrl?: string }) =>
      organizationApi.requestPlanChange(data),
    onSuccess: (result) => {
      const planChange = result.data;
      if (planChange?.mode === "scheduled") {
        queryClient.setQueryData<ApiResponse<SubscriptionInfo>>(
          queryKeys.organization.subscription(),
          (current) => addScheduledChangeToSubscription(current, planChange),
        );
        return;
      }

      // Refresh for changes that take effect now, and for cancel-downgrade
      // ("current") which clears pendingPlanSlug from the entitlement.
      // Checkout redirect reconciles on return so no refresh needed there.
      if (planChange?.mode === "activated" || planChange?.mode === "current") {
        queryClient.invalidateQueries({
          queryKey: queryKeys.organization.subscription(),
        });
      }
    },
    onError: handleMutationError,
  });
};

function addScheduledChangeToSubscription(
  current: ApiResponse<SubscriptionInfo> | undefined,
  change: Extract<PlanChangeResult, { mode: "scheduled" }>,
): ApiResponse<SubscriptionInfo> | undefined {
  const entitlement = current?.data?.entitlement;
  if (!current || !entitlement) return current;

  return {
    ...current,
    data: {
      ...current.data,
      entitlement: {
        ...entitlement,
        pendingPlanChange: {
          type: "downgrade",
          planSlug: change.planSlug,
          planName: change.planName,
          effectiveAt: change.effectiveAt,
        },
      },
    },
  };
}

// POST /api/organization/subscription/cancel - Self-serve at-period-end cancel
// (or resume with { resume: true }). Writes the resulting cancel state straight
// into the subscription cache so the "cancels on {date}" banner flips instantly,
// then reconciles with a refetch.
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { resume?: boolean }) =>
      organizationApi.cancelSubscription(data),
    onSuccess: (result) => {
      const outcome = result.data;
      queryClient.setQueryData<ApiResponse<SubscriptionInfo>>(
        queryKeys.organization.subscription(),
        (current) => applyCancellationToSubscription(current, outcome),
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization.subscription(),
      });
    },
    onError: handleMutationError,
  });
};

function applyCancellationToSubscription(
  current: ApiResponse<SubscriptionInfo> | undefined,
  outcome: SubscriptionCancelResult | undefined,
): ApiResponse<SubscriptionInfo> | undefined {
  const entitlement = current?.data?.entitlement;
  if (!current || !entitlement || !outcome) return current;

  const scheduled = outcome.mode === "scheduled";
  return {
    ...current,
    data: {
      ...current.data,
      entitlement: {
        ...entitlement,
        cancelAtPeriodEnd: scheduled,
        cancelAt: scheduled ? outcome.cancelAt ?? entitlement.currentPeriodEnd : null,
      },
    },
  };
}

// POST /api/organization/plan-change/reconcile - Reconcile a returning checkout
export const useReconcilePlanChange = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { sessionId: string }) =>
      organizationApi.reconcilePlanChange(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization.subscription(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.organization.features(),
      });
    },
    onError: handleMutationError,
  });
};

// PUT /api/organization - Update organization details (supports logo upload via FormData)
export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: FormData | Record<string, any>) =>
      organizationApi.update(data),
    onSuccess: (result) => {
      handleMutationSuccess(
        result.message || "Organization updated successfully!",
      );

      // Sync the auth store so the sidebar (logo + name) and the browser-tab
      // icon (favicon) reflect the change immediately, without waiting for the
      // next /auth/me refresh. Anything storefront- or chrome-visible that this
      // endpoint can write has to be listed here or it silently lags a reload —
      // which is exactly how the favicon behaved until browser QA caught it.
      const updated = result.data as
        | {
            name?: string;
            slug?: string;
            currency?: string;
            timezone?: string;
            weekStartDay?: number;
            address?: string;
            receiptSettings?: ReceiptSettings;
            logo?: { url: string; mediumUrl: string; thumbnailUrl: string; publicId: string } | null;
            favicon?: { url: string; mediumUrl: string; thumbnailUrl: string; publicId: string } | null;
          }
        | undefined;
      if (user && updated) {
        updateUser({
          organization: {
            ...user.organization,
            ...(updated.name !== undefined && { name: updated.name }),
            ...(updated.slug !== undefined && { slug: updated.slug }),
            ...(updated.currency !== undefined && { currency: updated.currency }),
            ...(updated.timezone !== undefined && { timezone: updated.timezone }),
            // Week start drives every "this week" figure; stale here means the
            // period labels disagree with the numbers until the next reload.
            ...(updated.weekStartDay !== undefined && { weekStartDay: updated.weekStartDay }),
            ...(updated.address !== undefined && { address: updated.address }),
            // Keep the printed letterhead (invoices/receipts/returns) in sync.
            ...(updated.receiptSettings !== undefined && {
              receiptSettings: updated.receiptSettings,
            }),
            // Always sync logo (including removal where it becomes null/undefined)
            logo: updated.logo ?? undefined,
            // Same for the favicon — `useOrgFavicon` reads it straight off this
            // store, so without this line the tab keeps the old icon (or the
            // platform default) until the next full load.
            favicon: updated.favicon ?? undefined,
          },
        });
      }

      invalidate(queryClient, "org.changed");
      // The org favicon is rendered by the public storefront (it is the shop's
      // tab icon too), so an org save has to flush the shop's server-side cache
      // for the same reason the storefront settings saves below do. Without it
      // the change waits out the 5-minute `store:{slug}` window.
      void revalidateStorefront();
    },
    onError: handleMutationError,
  });
};

// PUT /api/organization/form-settings - Update form field visibility settings
export const useUpdateFormSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExcludedFieldsSettings) =>
      organizationApi.updateFormSettings(data),
    onSuccess: (result) => {
      handleMutationSuccess(
        result.message || "Form settings updated successfully!",
      );
      invalidate(queryClient, "org.changed");
    },
    onError: handleMutationError,
  });
};

// GET /api/organization/features - Get feature flags
export const useGetFeatures = () => {
  return useQuery({
    queryKey: queryKeys.organization.features(),
    queryFn: () => organizationApi.getFeatures(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// PUT /api/organization/features - Toggle features within the plan ceiling
export const useUpdateFeatures = () => {
  const queryClient = useQueryClient();
  const updateFeaturesStore = useAuthStore((state) => state.updateFeatures);

  return useMutation({
    mutationFn: (data: Partial<OrganizationFeatures>) =>
      organizationApi.updateFeatures(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Features updated successfully!");
      // Sync the enforced feature set into the auth store so the nav/guards
      // reflect the change immediately.
      if (result.data?.features) {
        updateFeaturesStore(result.data.features);
      }
      // Write the server-confirmed result straight into the features cache
      // instead of invalidating: avoids a refetch where the other switches —
      // and the just-toggled one — briefly render stale (the blink).
      queryClient.setQueryData(queryKeys.organization.features(), result);
      invalidate(queryClient, "org.changed");
      // Turning `storefront` off takes the public shop offline, and the confirm
      // dialog promises exactly that — but the shop's server-side cache is only
      // tagged, so without this flush it keeps serving for up to the 5-minute
      // `getStore` window while the API already 404s. A merchant who pulls their
      // shop down (wrong prices, a mistaken launch) watches it stay up, and
      // orders can still land in that gap. Media and theme saves already flush;
      // this is the change that matters most and was the one missing it.
      void revalidateStorefront();
    },
    onError: handleMutationError,
  });
};

/**
 * GET /api/organization/features/impact — counts behind each risky toggle.
 *
 * Fetched once for the whole page rather than per-switch: the confirm dialog
 * needs the number the instant it opens, and a spinner inside a "are you sure"
 * is worse than a slightly stale count.
 */
export const useFeatureImpact = () =>
  useQuery({
    queryKey: queryKeys.organization.featureImpact(),
    queryFn: () => organizationApi.getFeatureImpact(),
    staleTime: 60 * 1000,
  });

/**
 * POST /api/organization/onboarding — save one step of the setup wizard.
 *
 * Writes through the same path as the settings toggles, so the auth store and
 * the features cache are refreshed the same way: the sidebar reflects each
 * answer immediately, and the workspace gate sees `completedAt` the moment the
 * final step lands.
 */
export const useApplyOnboardingStep = () => {
  const queryClient = useQueryClient();
  const updateFeaturesStore = useAuthStore((state) => state.updateFeatures);
  const updateTaxConfig = useAuthStore((state) => state.updateTaxConfig);
  const setOnboardingCompleted = useAuthStore(
    (state) => state.setOnboardingCompleted,
  );

  return useMutation({
    mutationFn: (data: OnboardingStepPayload) =>
      organizationApi.applyOnboardingStep(data),
    onSuccess: (result) => {
      if (result.data?.features) {
        updateFeaturesStore(result.data.features);
      }
      // The VAT answer, into the same store the POS reads. `features.tax` alone
      // cannot carry it — it is true for standard, reduced and turnover alike —
      // so a merchant who answers "turnover tax" and is left with an empty
      // history hits the undeclared-registration bridge in `vatRegistrationOf`,
      // is treated as standard-rated, and gets VAT previewed on every line the
      // backend posts none on. It survived until a hard reload, because `useMe`
      // is a mutation and no invalidation can refetch it.
      if (result.data?.vatRegistrationHistory) {
        updateTaxConfig({
          vatRegistrationHistory: result.data.vatRegistrationHistory,
        });
      }
      // The workspace gate reads completion from the auth store, so it has to
      // learn about it here — otherwise finishing the wizard bounces the
      // merchant straight back into it off a stale `null`.
      const completedAt = result.data?.onboarding?.completedAt;
      if (completedAt) {
        setOnboardingCompleted(completedAt);
      }
      queryClient.setQueryData(queryKeys.organization.features(), result);
      invalidate(queryClient, "org.changed");
      // Same reason as `useUpdateFeatures`: answering "shop only" in the wizard
      // disables `storefront`, and a shop seeded with demo data is already
      // published — so the public store must go dark now, not in five minutes.
      void revalidateStorefront();
    },
    // Deliberately no success toast: the wizard advances a step on every save,
    // and a toast per question would stack six deep by the review screen.
    onError: handleMutationError,
  });
};

// PUT /api/organization/vat-settings - Update VAT settings / registration
export const useUpdateVatSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      vatSettings?: Partial<VatSettings>;
      registration?: { type: VatRegistrationType; effectiveFrom: string };
    }) => organizationApi.updateVatSettings(data),
    onSuccess: (result) => {
      handleMutationSuccess(
        result.message || "VAT settings updated successfully!",
      );
      invalidate(queryClient, "org.changed");
    },
    onError: handleMutationError,
  });
};

// PUT /api/organization/column-settings - Update table column visibility
export const useUpdateColumnSettings = () => {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: ExcludedColumnsSettings) =>
      organizationApi.updateColumnSettings(data),
    onSuccess: (result) => {
      handleMutationSuccess(
        result.message || "Column settings updated successfully!",
      );

      // Sync the auth store so useFilteredColumns reacts immediately
      if (user && result.data?.excludedColumns) {
        updateUser({
          organization: {
            ...user.organization,
            settings: {
              ...user.organization?.settings,
              excludedColumns: {
                ...user.organization?.settings?.excludedColumns,
                ...result.data.excludedColumns,
              },
            },
          },
        });
      }

      invalidate(queryClient, "org.changed");
    },
    onError: handleMutationError,
  });
};

// GET /api/organization/storefront - Get storefront settings (lazily created
// backend-side). Requires the `storefront` feature + `storefront.view`, so
// callers that may run before the feature is on (the Features settings page,
// checking whether to nudge toward publishing) should pass `enabled: false`
// until it is.
export const useGetStorefrontSettings = (enabled = true) => {
  return useQuery({
    queryKey: queryKeys.organization.storefront(),
    queryFn: () => organizationApi.getStorefrontSettings(),
    select: (res) => res.data,
    staleTime: 60 * 1000, // 1 minute
    enabled,
  });
};

// PATCH /api/organization/storefront - Update storefront settings / publish state
// This is the theme/templates/navigation/checkout save, i.e. the most visible
// public change a merchant can make — so it flushes the shop's server-side cache
// directly. It can't go through `invalidate()` like the storefront catalog
// mutations do: the response IS the new settings, written straight into the cache
// below, and any event carrying `organization.all()` would immediately refetch
// what we just wrote.
export const useUpdateStorefrontSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateStorefrontSettingsDto) =>
      organizationApi.updateStorefrontSettings(data),
    onSuccess: (result) => {
      handleMutationSuccess(
        result.message || "Store settings updated successfully!",
      );
      queryClient.setQueryData(queryKeys.organization.storefront(), result);
      void revalidateStorefront();
    },
    onError: handleMutationError,
  });
};

// PATCH /api/organization/storefront/media - Upload/replace/remove logo + banner
// Logo and banner are rendered by the storefront shell, so this flushes the
// public cache for the same reason as above. (The store logo is no longer the
// shop's favicon — that is `organization.favicon`, saved from Settings →
// Organization, which flushes the same tag from `useUpdateOrganization`.)
export const useUpdateStorefrontMedia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) =>
      organizationApi.updateStorefrontMedia(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Storefront media updated");
      queryClient.setQueryData(queryKeys.organization.storefront(), result);
      void revalidateStorefront();
    },
    onError: handleMutationError,
  });
};

// POST /api/organization/storefront/media/hero-slide - Upload one storefront
// image. Returns uploadInfo only (no cache write): the editor embeds it in a
// slide / announcement and persists via the settings PATCH. Shared by the hero
// slides panel and the announcement-bar background.
export const useUploadStorefrontImage = () => {
  return useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("image", file);
      return organizationApi.uploadStorefrontImage(fd);
    },
    onError: handleMutationError,
  });
};

// DELETE /api/organization/demo-data - Clear all sample data.
// On success the workspace simply drops its sample rows; refresh user/org + all data.
export const useClearDemoData = () => {
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  return useMutation({
    mutationFn: () => organizationApi.clearDemoData(),
    onSuccess: (result) => {
      handleMutationSuccess(
        result.message || "Sample data cleared successfully!",
      );

      // Drop the seed status in the auth store immediately so the sample-data
      // banner disappears without a full reload.
      if (user) {
        updateUser({
          organization: {
            ...user.organization,
            demoSeedStatus: undefined,
          },
        });
      }

      // Clearing demo data deletes rows in every module at once — there is no smaller honest
      // answer than "everything".
      // eslint-disable-next-line query-cache/no-blanket-invalidate -- demo data spans every module
      queryClient.invalidateQueries();
    },
    onError: handleMutationError,
  });
};
