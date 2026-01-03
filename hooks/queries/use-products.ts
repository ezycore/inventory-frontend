import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { handleMutationError } from '@/lib/error-handling'
import { productsApi } from '@/lib/api-client'
import type { 
  Product, 
  ProductWithVariants, 
  CreateProductDto, 
  UpdateProductDto
} from '@/types'
import type { ProductFilters } from '@/types/products'

/**
 * Hook for fetching products with optional filters
 */
export const useProducts = (filters: ProductFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => productsApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for fetching a single product by ID
 */
export const useProduct = (id: string) => {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productsApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook for fetching a product by slug (for frontend display)
 */
export const useProductBySlug = (slug: string) => {
  return useQuery({
    queryKey: queryKeys.products.bySlug(slug),
    queryFn: () => productsApi.getBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook for searching products
 */
export const useProductSearch = (query: string) => {
  return useQuery({
    queryKey: queryKeys.products.search(query),
    queryFn: () => productsApi.search(query),
    enabled: query.length > 2,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook for fetching a product with its variants
 */
export const useProductWithVariants = (id: string) => {
  return useQuery({
    queryKey: queryKeys.products.withVariants(id),
    queryFn: async (): Promise<ProductWithVariants> => {
      const [productData, variantsData] = await Promise.all([
        productsApi.getById(id),
        import('@/lib/api-client').then(m => m.variantsApi.getByProduct(id))
      ])
      const product = ((productData as any)?.data) as Product
      const variants = (((variantsData as any)?.data?.items) || []) as any[]
      return {
        ...product,
        variants: variants
      }
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Mutation hook for creating a new product
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductDto) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })
    },
    onError: handleMutationError,
  })
}

/**
 * Mutation hook for updating a product
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: FormData | ({ id: string } & Partial<CreateProductDto>)) => {
      if (data instanceof FormData) {
        const id = data.get('id') as string
        return productsApi.update(id, data)
      }
      const { id, ...rest } = data
      return productsApi.update(id, rest)
    },
    onSuccess: (_, variables) => {
      const id = variables instanceof FormData
        ? variables.get('id') as string
        : variables.id
      
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) })
    },
    onError: handleMutationError,
  })
}

/**
 * Mutation hook for deleting a product
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() })
      // Also invalidate variants since they belong to the product
      queryClient.invalidateQueries({ queryKey: queryKeys.variants.all() })
    },
    onError: handleMutationError,
  })
}