import { createResourceHooks, handleMutationSuccess } from "@/hooks/queries/helper"
import { organizationApi } from "@/lib/api"
import { queryKeys } from "@/lib//query-keys-products"
import { createOrganizationDto, OrganizationData, UpdateOrganizationDto } from "@/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { handleMutationError } from "@/lib/error-handling"


const useGetOrganizationApi = () => {
  return useQuery({
    queryKey: queryKeys.organization.get(),
    queryFn: () => organizationApi.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

const useCreateOrganizationApi = () => {
   const queryClient = useQueryClient()

  return useMutation({
   mutationFn: (data: FormData) => organizationApi.create(data),
   onSuccess: (data) => {
    handleMutationSuccess(data.message || 'Item created successfully')
    queryClient.invalidateQueries({ queryKey: queryKeys.organization.get() })
   },
   onError: handleMutationError,
  })
}
//create update hook
const useUpdateOrganizationApi = () => {
   const queryClient = useQueryClient()
  return useMutation({
   mutationFn: (data: FormData | UpdateOrganizationDto) => {
    return organizationApi.update(data as UpdateOrganizationDto)
   },
   onSuccess: (_, variables) => {
    handleMutationSuccess(_.message || 'Item updated successfully')
    queryClient.invalidateQueries({ queryKey: queryKeys.organization.get() })
   },
   onError: handleMutationError,
  })
}

const useDeleteOrganizationApi = () => {
   const queryClient = useQueryClient()
  return useMutation({
   mutationFn: () => organizationApi.delete(),
   onSuccess: (data) => {
    handleMutationSuccess(data.message || 'Item deleted successfully')
    queryClient.invalidateQueries({ queryKey: queryKeys.organization.get() })
   },
   onError: handleMutationError,
  })
}

const useFormSettingsOrganizationApi = () => {
   const queryClient = useQueryClient()
  return useMutation({
   mutationFn: (data: FormData | UpdateOrganizationDto) => {
    return organizationApi.updateFormSettings(data as UpdateOrganizationDto)
   },
   onSuccess: (_, variables) => {
    handleMutationSuccess(_.message || 'Item updated successfully')
    queryClient.invalidateQueries({ queryKey: queryKeys.organization.get() })
   },
   onError: handleMutationError,
  })
}


export const useOrganization = () => {
  return {
    useGetOrganizationApi,
    useCreateOrganizationApi,
    useUpdateOrganizationApi,
    useDeleteOrganizationApi,
    useFormSettingsOrganizationApi,
  }
}
