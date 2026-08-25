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

// Get default account
export function useDefaultAccount() {
  return useQuery({
    queryKey: queryKeys.accounts.default(),
    queryFn: () => accountsApi.getDefault(),
    select: (data) => data.data,
  })
}

// Get account summary
export function useAccountSummary() {
  return useQuery({
    queryKey: queryKeys.accounts.summary(),
    queryFn: () => accountsApi.getSummary(),
    select: (data) => data.data,
  })
}

// Minimal account list for the sale/purchase payment picker — reachable by
// sales.create/purchases.create as well as accounts.view, so a sell-only or
// receiving-only role can take payment without the full accounts list.
export function useAccountPaymentOptions() {
  return useQuery({
    queryKey: queryKeys.accounts.paymentOptions(),
    queryFn: () => accountsApi.getPaymentOptions(),
    select: (data) => data.data,
  })
}

// Aliases for consistency with other hooks
export const useAddAccount = useCreateAccount
