import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys-products'
import { handleMutationError } from '@/lib/error-handling'
import { categoriesApi } from '@/lib/api-client'
import type { Category, CreateCategoryDto } from '@/types/products'

/**
 * Hook for fetching all categories
 */
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.category.all(),
    queryFn: () => categoriesApi.getAll(),
  })
}

/**
 * Hook for fetching a single category by ID
 */
export const useCategory = (id: string) => {
  return useQuery({
    queryKey: queryKeys.category.detail(id),
    queryFn: () => categoriesApi.getById(id),
    enabled: !!id,
  })
}

/**
 * Mutation hook for creating new category
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCategoryDto) =>
      categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.category.all() })
    },
    onError: handleMutationError,
  })
}

/**
 * Mutation hook for updating category
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Category>) =>
      categoriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.category.all() })
    },
    onError: handleMutationError,
  })
}

/**
 * Mutation hook for deleting category
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.category.all() })
    },
    onError: handleMutationError,
  })
}

// Alias for backward compatibility
export const useAddCategory = useCreateCategory
