import { customersApi, CustomerLedgerFilters } from '@/services/api'
import { createResourceHooks } from '../query-helpers'
import { queryKeys } from '@/services/api/query-keys'
import { CreateCustomerDto, ReceiveCustomerPaymentDto } from '@/types'
import type { ApiCustomer, CustomerListItem } from '@/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { handleMutationError } from '@/lib/error-handling'
import { invalidate } from '@/services/api/invalidation'

const customerHooks = createResourceHooks<ApiCustomer, CreateCustomerDto, Partial<CreateCustomerDto>, CustomerListItem>(
 customersApi,
 queryKeys.customers,
 // Sales documents embed the customer's name and terms.
 { events: ["party.changed"] },
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

// Get account-wide customer statement (for printing). Pre-fetched while the
// ledger sheet is open so the print can run synchronously in the click.
export const useCustomerStatement = (
  customerId: string | null,
  filters: { startDate?: string; endDate?: string } = {},
  enabled = true,
) => {
  return useQuery({
    queryKey: queryKeys.customers.statement(customerId!, filters),
    queryFn: () => customersApi.getStatement(customerId!, filters),
    enabled: !!customerId && enabled,
    staleTime: 1 * 60 * 1000,
  })
}

// Open invoices behind the "Receive Payment" allocation table. Not cached —
// the split it previews must match what the server will settle.
export const useCustomerOutstanding = (customerId: string | null, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.customers.outstanding(customerId!),
    queryFn: () => customersApi.getOutstanding(customerId!),
    enabled: !!customerId && enabled,
    staleTime: 0,
  })
}

// Settle several outstanding invoices with one payment. Dirties the same keys as
// a per-invoice payment — it is the same money movement, just batched.
export const useReceiveCustomerPayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      customerId,
      ...data
    }: ReceiveCustomerPaymentDto & { customerId: string }) =>
      customersApi.receivePayment(customerId, data),
    onSuccess: (data) => {
      toast.success(data.message || 'Payment received')
      invalidate(queryClient, 'sale.paid')
    },
    onError: handleMutationError,
  })
}

// Email an outstanding-dues statement to the customer. No cache invalidation —
// sending a statement doesn't change any data.
export const useEmailCustomerStatement = () => {
  return useMutation({
    mutationFn: ({ customerId, email }: { customerId: string; email?: string }) =>
      customersApi.emailStatement(customerId, email ? { email } : {}),
    onSuccess: (data) => {
      toast.success(data.message || 'Statement emailed')
    },
    onError: handleMutationError,
  })
}
