import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { variantsApi } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys-products'
import type { 
  Variant, 
  CreateVariantDto
} from '@/types'

/**
 * Product Variants Query Hooks
 * 
 * These hooks manage actual product variations (instances with SKU, price, stock).
 * For variant attributes (templates like Color, Size), see use-variants.ts
 * For stock movements, see use-stock.ts
 * 
 * Current hooks:
 * - useProductVariants: Fetch all variants with filters (used in dashboard)
 * - useVariantsByProduct: Fetch variants for a specific product
 * - useCreateVariant: Create new variant (used in add-variant-modal)
 * - useDeleteVariant: Delete variant (used in product variants page)
 */

// Get all product variants with filters
export const useProductVariants = (filters?: any) => {
  return useQuery({
    queryKey: queryKeys.variants.filtered(filters),
    queryFn: () => variantsApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get variants by product ID
export const useVariantsByProduct = (productId: string) => {
  return useQuery({
    queryKey: queryKeys.variants.byProduct(productId),
    queryFn: () => variantsApi.getByProduct(productId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!productId,
  })
}

// Create variant mutation
export const useCreateVariant = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateVariantDto) => {
      const response = await variantsApi.create(data)
      return response.data as Variant
    },
    onSuccess: (newVariant: Variant) => {
      // Invalidate variant lists
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.variants.byProduct(newVariant.product_id) 
      })
      
      // Add to cache
      queryClient.setQueryData(
        queryKeys.variants.detail(newVariant._id),
        newVariant
      )
    },
  })
}

// Delete variant mutation
export const useDeleteVariant = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => variantsApi.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.variants.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.list({}) })
    },
  })
}