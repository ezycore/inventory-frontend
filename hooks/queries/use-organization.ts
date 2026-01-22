import { handleMutationSuccess } from "@/hooks/queries/helper";
import { queryKeys } from "@/lib//query-keys-products";
import { organizationApi } from "@/lib/api";
import { ExcludedFieldsSettings } from "@/lib/api/organization";
import { handleMutationError } from "@/lib/error-handling";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useGetOrganizationApi = () => {
  return useQuery({
    queryKey: queryKeys.organization.get(),
    queryFn: () => organizationApi.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

//create update hook
export const useUpdateOrganizationApi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => {
      return organizationApi.update(data);
    },
    onSuccess: (_, variables) => {
      handleMutationSuccess(_.message || "Item updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.get() });
    },
    onError: handleMutationError,
  });
};

export const useDeleteOrganizationApi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => organizationApi.delete(),
    onSuccess: (data) => {
      handleMutationSuccess(data.message || "Item deleted successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.get() });
    },
    onError: handleMutationError,
  });
};

export const useFormSettingsOrganizationApi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExcludedFieldsSettings) => {
      return organizationApi.updateFormSettings(data);
    },
    onSuccess: (_, variables) => {
      handleMutationSuccess(_.message || "Item updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.get() });
    },
    onError: handleMutationError,
  });
};
