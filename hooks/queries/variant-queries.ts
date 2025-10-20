import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { variantsApi, stockApi } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys-products'
import type { 
  Variant, 
  CreateVariantDto, 
  UpdateVariantDto, 
  VariantFilters,
  StockMovement,
  CreateStockMovementDto
} from '@/types'

// Get all variants with filters
export const useVariants = (filters?: VariantFilters) => {
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

// Get single variant
export const useVariant = (id: string) => {
  return useQuery({
    queryKey: queryKeys.variants.detail(id),
    queryFn: () => variantsApi.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
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

// Update variant mutation
export const useUpdateVariant = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateVariantDto }) => {
      const response = await variantsApi.update(id, data)
      return response.data as Variant
    },
    onSuccess: (updatedVariant: Variant) => {
      // Update cache
      queryClient.setQueryData(
        queryKeys.variants.detail(updatedVariant._id),
        updatedVariant
      )
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.variants.byProduct(updatedVariant.product_id) 
      })
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

// Stock movement queries
export const useStockMovements = (variantId?: string) => {
  return useQuery({
    queryKey: queryKeys.stockMovements.byVariant(variantId),
    queryFn: () => stockApi.getMovements({ variant_id: variantId! }),
    enabled: !!variantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Create stock movement mutation
export const useCreateStockMovement = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateStockMovementDto) => {
      const response = await stockApi.createMovement(data)
      return response.data as StockMovement
    },
    onSuccess: (newMovement: StockMovement) => {
      // Invalidate stock movements
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.stockMovements.byVariant(newMovement.variant_id) 
      })
      
      // Invalidate variant to update stock quantities
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.variants.detail(newMovement.variant_id) 
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
    },
  })
}

// Utility hooks for variant operations
export const useVariantStats = (productId: string) => {
  const { data: variants = [] } = useVariantsByProduct(productId)
  
  // Type assertion to ensure proper typing
  const typedVariants = variants as Variant[]
  
  return {
    totalVariants: typedVariants.length,
    activeVariants: typedVariants.filter((v: Variant) => v.status === 'active').length,
    totalStock: typedVariants.reduce((sum: number, v: Variant) => sum + v.stock_quantity, 0),
    lowStockVariants: typedVariants.filter((v: Variant) => 
      v.stock_quantity <= v.low_stock_threshold
    ).length,
    outOfStockVariants: typedVariants.filter((v: Variant) => v.stock_quantity === 0).length,
    averagePrice: typedVariants.length > 0 
      ? typedVariants.reduce((sum: number, v: Variant) => sum + v.price, 0) / typedVariants.length 
      : 0,
  }
}

// Bulk operations
export const useBulkUpdateVariants = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (updates: Array<{ id: string; data: Partial<UpdateVariantDto> }>) =>
      Promise.all(updates.map(({ id, data }) => variantsApi.update(id, data))),
    onSuccess: () => {
      // Invalidate all variant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
    },
  })
}

export const useBulkDeleteVariants = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map(id => variantsApi.delete(id))),
    onSuccess: () => {
      // Invalidate all variant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
    },
  })
}