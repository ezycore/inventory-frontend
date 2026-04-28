import { queryKeys } from "@/services/api/query-keys";
import { ExcludedColumnsSettings, ExcludedFieldsSettings, organizationApi } from "@/services/api";
import type { OrganizationFeatures } from "@/types";
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

// PUT /api/organization/column-settings - Update table column visibility
export const useUpdateColumnSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ExcludedColumnsSettings) =>
      organizationApi.updateColumnSettings(data),
    onSuccess: (result) => {
      handleMutationSuccess(
        result.message || "Column settings updated successfully!",
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.get() });
    },
    onError: handleMutationError,
  });
};
