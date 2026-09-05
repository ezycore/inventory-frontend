// Export all organized query hooks by domain
export * from "../services/api";

// Export utility hooks
export * from "../utils";

// Export page management hooks
export { useCrudModal } from "./use-crud-handlers";
export { useHasPermission, PERMISSIONS } from "./use-has-permission";
export { useStockTracked } from "./use-stock-tracked";
export { useCostGatedColumns } from "./use-cost-gated-columns";
export { usePaginationHandler } from "./use-pagination-handler";
export { useHydrated } from "./use-hydrated";
export { useReceiptSettings } from "./use-receipt-settings";
export type {
  ReceiptFormState,
  ReceiptSettingsActions,
} from "./use-receipt-settings";

// Re-export TanStack Query utilities for convenience
export {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

// Export query keys and API client
export { apiClient } from "@/services/api";
export { getErrorMessage, handleMutationError } from "@/lib/error-handling";
export { queryKeys } from "@/services/api/query-keys";
