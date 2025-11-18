// Export all organized query hooks by domain
export * from './queries'

// Export utility hooks
export * from './utils'

// Re-export TanStack Query utilities for convenience
export {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  useSuspenseQuery,
  type UseQueryResult,
  type UseMutationResult,
  type QueryClient,
} from '@tanstack/react-query'

// Export query keys and API client
export { queryKeys } from '@/lib/query-keys'
export { apiClient } from '@/lib/api-client'
export { getErrorMessage, handleMutationError } from '@/lib/error-handling'
