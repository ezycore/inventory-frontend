import { accountsApi } from '@/services/api'
import { createResourceHooks } from '../query-helpers'
import { queryKeys } from '@/services/api/query-keys'
import { CreateAccountDto, UpdateAccountDto } from '@/types'
import type { ApiAccount } from '@/types/api'
import { useQuery } from '@tanstack/react-query'
import type { AccountFilters } from './api'

const accountHooks = createResourceHooks<ApiAccount, CreateAccountDto, UpdateAccountDto>(
  accountsApi,
  queryKeys.accounts
)

export const useAccounts = accountHooks.useList
export const useAccount = accountHooks.useDetail
export const useCreateAccount = accountHooks.useCreate
export const useUpdateAccount = accountHooks.useUpdate
export const useDeleteAccount = accountHooks.useDelete
export const useBulkDeleteAccounts = accountHooks.useBulkDelete

// Get account summary
export function useAccountSummary() {
  return useQuery({
    queryKey: queryKeys.accounts.summary(),
    queryFn: () => accountsApi.getSummary(),
    select: (data) => data.data,
  })
}

// Minimal account list shared by every "which account" payment picker
// (sales, purchases, storefront orders) — reachable by more than
// accounts.view, so a role scoped to just one of those domains can take
// payment without the full accounts list. `enabled` lets a caller that
// already knows the `accounts` feature is off (use-order-account-options)
// skip a request the backend's requireFeature("accounts") would refuse.
export function useAccountPaymentOptions(enabled = true) {
  return useQuery({
    queryKey: queryKeys.accounts.paymentOptions(),
    queryFn: () => accountsApi.getPaymentOptions(),
    select: (data) => data.data,
    enabled,
  })
}

// Aliases for consistency with other hooks
export const useAddAccount = useCreateAccount
