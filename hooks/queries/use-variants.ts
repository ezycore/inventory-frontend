import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys-products'
import { handleMutationError } from '@/lib/error-handling'
import { variantAttributesApi } from '@/lib/api'
import type { VariantAttribute, CreateVariantAttributeDto } from '@/types'

/**
 * Hook for fetching all variant attributes
 */
export const useVariantAttributes = () => {
  return useQuery({
    queryKey: queryKeys.variantAttributes.list(),
    queryFn: () => variantAttributesApi.getAll(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for fetching a single variant attribute by ID
 */
export const useVariantAttribute = (id: string) => {
  return useQuery({
    queryKey: queryKeys.variantAttributes.detail(id),
    queryFn: () => variantAttributesApi.getById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Mutation hook for creating a new variant attribute
 * Note: Data processing (values string to array conversion) is handled automatically by variantAttributesApi
 */
export const useCreateVariantAttribute = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateVariantAttributeDto | FormData) =>
      variantAttributesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.variantAttributes.all() })
    },
    onError: handleMutationError,
  })
}

/**
 * Mutation hook for updating a variant attribute
 * Note: Data processing (values string to array conversion) is handled automatically by variantAttributesApi
 */
export const useUpdateVariantAttribute = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: FormData | ({ id: string } & Partial<CreateVariantAttributeDto>)) => {
      if (data instanceof FormData) {
        const id = data.get('id') as string;
        return variantAttributesApi.update(id, data);
      }
      const { id, ...rest } = data;
      return variantAttributesApi.update(id, rest);
    },
    onSuccess: (_, variables) => {
      const id = variables instanceof FormData
        ? variables.get('id') as string
        : variables.id;
      queryClient.invalidateQueries({ queryKey: queryKeys.variantAttributes.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.variantAttributes.detail(id) })
    },
    onError: handleMutationError,
  })
}

/**
 * Mutation hook for deleting a variant attribute
 */
export const useDeleteVariantAttribute = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => variantAttributesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.variantAttributes.all() })
    },
    onError: handleMutationError,
  })
}
