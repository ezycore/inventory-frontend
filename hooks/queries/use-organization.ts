import { handleMutationSuccess } from "@/hooks/queries/helper";
import { queryKeys } from "@/lib//query-keys-products";
import { organizationApi } from "@/lib/api";
import { ExcludedFieldsSettings } from "@/lib/api/organization";
import { handleMutationError } from "@/lib/error-handling";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const useGetOrganizationApi = () => {
  return useQuery({
    queryKey: queryKeys.organization.get(),
    queryFn: () => organizationApi.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateOrganizationApi = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: FormData) => organizationApi.create(data),
    onSuccess: (data) => {
      handleMutationSuccess(data.message || "Item created successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.get() });
      // Redirect to dashboard after successful login
      router.push("/login?registered=true");
    },
    onError: handleMutationError,
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
