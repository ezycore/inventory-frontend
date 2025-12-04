import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys-products'
import { handleMutationError } from '@/lib/error-handling'
import { brandsApi } from '@/lib/api-client'
import type { Brand, CreateBrandDto } from '@/types/products'

/**
 * Hook for fetching all brands
 */
export const useBrands = () => {
  return useQuery({
    queryKey: queryKeys.brands.list(),
    queryFn: () => brandsApi.getAll(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for fetching a single brand by ID
 */
export const useBrand = (id: string) => {
  return useQuery({
    queryKey: queryKeys.brands.detail(id),
    queryFn: () => brandsApi.getById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Hook for fetching a brand by slug
 */
export const useBrandBySlug = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.brands.bySlug(slug),
    queryFn: () => brandsApi.getBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Mutation hook for creating a new brand
 */
export const useCreateBrand = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBrandDto | FormData) =>
      brandsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all() })
    },
    onError: handleMutationError,
  })
}

/**
 * Mutation hook for updating a brand
 */
export const useUpdateBrand = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: FormData | ({ id: string } & Partial<CreateBrandDto>)) => {
      if (data instanceof FormData) {
        const id = data.get('id') as string;
        return brandsApi.update(id, data);
      }
      const { id, ...rest } = data;
      return brandsApi.update(id, rest);
    },
    onSuccess: (_, variables) => {
      const id = variables instanceof FormData
        ? variables.get('id') as string
        : variables.id;
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.detail(id) })
    },
    onError: handleMutationError,
  })
}

/**
 * Mutation hook for deleting a brand
 */
export const useDeleteBrand = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => brandsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all() })
      // Also invalidate products since they reference brands
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })
    },
    onError: handleMutationError,
  })
}