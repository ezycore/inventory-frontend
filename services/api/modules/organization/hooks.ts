import { queryKeys } from "@/services/api/query-keys";
import {
  ExcludedColumnsSettings,
  ExcludedFieldsSettings,
  organizationApi,
} from "@/services/api";
import type {
  ApiResponse,
  FinancialYearConfig,
  OrganizationFeatures,
  PlanChangeResult,
  SubscriptionInfo,
  TaxSettings,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { handleMutationError } from "@/lib/error-handling";
import { handleMutationSuccess } from "../query-helpers";
import { useAuthStore } from "@/services/stores/use-auth-store";

// GET /api/organization - Get organization details
export const useGetOrganizationApi = () => {
  return useQuery({
    queryKey: queryKeys.organization.get(),
    queryFn: () => organizationApi.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// GET /api/organization/subscription - Current plan/entitlement + usage
export const useGetSubscription = () => {
  return useQuery({
    queryKey: queryKeys.organization.subscription(),
    queryFn: () => organizationApi.getSubscription(),
    select: (res) => res.data,
    staleTime: 60 * 1000, // 1 minute
  });
};

// GET /api/organization/plans - Available plans (upgrade/downgrade options)
export const useGetAvailablePlans = () => {
  return useQuery({
    queryKey: queryKeys.organization.plans(),
    queryFn: () => organizationApi.getPlans(),
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

      // Sync the auth store so the sidebar (logo + name) reflects the change
      // immediately without waiting for the next /auth/me refresh.
      const updated = result.data as
        | {
            name?: string;
            slug?: string;
            currency?: string;
            timezone?: string;
            logo?: { url: string; mediumUrl: string; thumbnailUrl: string; publicId: string } | null;
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
            // Always sync logo (including removal where it becomes null/undefined)
            logo: updated.logo ?? undefined,
          },
        });
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.organization.get() });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.get() });
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

// PUT /api/organization/features - Update feature flags
export const useUpdateFeatures = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<OrganizationFeatures>) =>
      organizationApi.updateFeatures(data),
    onSuccess: (result) => {
      handleMutationSuccess(result.message || "Features updated successfully!");
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.organization.features(), 'me'],
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.get() });
    },
    onError: handleMutationError,
  });
};

// PUT /api/organization/tax-settings - Update tax sub-toggles + financial year
export const useUpdateTaxSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      taxSettings?: Partial<TaxSettings>;
      financialYear?: Partial<FinancialYearConfig>;
    }) => organizationApi.updateTaxSettings(data),
    onSuccess: (result) => {
      handleMutationSuccess(
        result.message || "Tax settings updated successfully!",
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.get() });
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

      queryClient.invalidateQueries({ queryKey: queryKeys.organization.get() });
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

      // Demo data spanned every module — refresh everything.
      queryClient.invalidateQueries();
    },
    onError: handleMutationError,
  });
};
