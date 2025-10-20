import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys-products'
import { handleMutationError } from '@/lib/error-handling'
import { variantsApi } from '@/lib/api-client'
import type { 
  Variant, 
  CreateVariantDto, 
  VariantFilters,
  VariantListResponse 
} from '@/types/products'

/**
 * Hook for fetching variants with optional filters
 */
export const useVariants = (filters: VariantFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.variants.list(filters),
    queryFn: () => variantsApi.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching variants by product ID
 */
export const useVariantsByProduct = (productId: string) => {
  return useQuery({
    queryKey: queryKeys.variants.byProduct(productId),
    queryFn: () => variantsApi.getByProduct(productId),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook for fetching a single variant by ID
 */
export const useVariant = (id: string) => {
  return useQuery({
    queryKey: queryKeys.variants.detail(id),
    queryFn: () => variantsApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook for fetching low stock variants
 */
export const useLowStockVariants = () => {
  return useQuery({
    queryKey: queryKeys.variants.lowStock(),
    queryFn: () => variantsApi.getLowStock(),
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Mutation hook for creating a new variant
 */
export const useCreateVariant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateVariantDto) => variantsApi.create(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.variants.byProduct(variables.product_id) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.products.withVariants(variables.product_id) 
      })
    },
    onError: handleMutationError,
  })
}

/**
 * Mutation hook for updating a variant
 */
export const useUpdateVariant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CreateVariantDto>) =>
      variantsApi.update(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.detail(variables.id) })
      
      // Extract product_id from variables or result
      const { id, ...updateData } = variables
      const productId = updateData.product_id || (result as any)?.product_id
      
      if (productId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.variants.byProduct(productId) 
        })
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.products.withVariants(productId) 
        })
      }
    },
    onError: handleMutationError,
  })
}

/**
 * Mutation hook for deleting a variant
 */
export const useDeleteVariant = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => variantsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })
    },
    onError: handleMutationError,
  })
}

/**
 * Mutation hook for bulk updating variant stock
 */
export const useBulkUpdateVariantStock = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Array<{ id: string; stock_quantity: number; reason?: string }>) =>
      Promise.all(
        updates.map(update => 
          variantsApi.update(update.id, { 
            stock_quantity: update.stock_quantity 
          })
        )
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.stock.all() })
    },
    onError: handleMutationError,
  })
}