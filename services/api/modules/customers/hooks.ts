import { customersApi, CustomerLedgerFilters } from '@/services/api'
import { createResourceHooks } from '../query-helpers'
import { queryKeys } from '@/lib/query-keys'
import { Customer, CreateCustomerDto } from '@/types'
import { useQuery } from '@tanstack/react-query'

const customerHooks = createResourceHooks<Customer, CreateCustomerDto>(
 customersApi,
 queryKeys.customers,
 {relatedQueryKeys: [queryKeys.customers.all(), ["select-options", "/sales/customers?all=true&fields=_id,name,defaultDiscountId"]]}
)

export const useCustomers = customerHooks.useList
export const useCustomer = customerHooks.useDetail
export const useCreateCustomer = customerHooks.useCreate
export const useUpdateCustomer = customerHooks.useUpdate
export const useDeleteCustomer = customerHooks.useDelete

// Get customers aggregated summary
export const useCustomersSummary = () => {
  return useQuery({
    queryKey: queryKeys.customers.summary(),
    queryFn: () => customersApi.getSummary(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get customer ledger
export const useCustomerLedger = (customerId: string | null, filters: CustomerLedgerFilters = {}) => {
  return useQuery({
    queryKey: queryKeys.customers.ledger(customerId!, filters),
    queryFn: () => customersApi.getLedger(customerId!, filters),
    enabled: !!customerId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}
