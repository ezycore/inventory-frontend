import { customersApi } from '@/services/api'
import { createResourceHooks } from '../query-helpers'
import { queryKeys } from '@/lib/query-keys'
import { Customer, CreateCustomerDto } from '@/types'

const customerHooks = createResourceHooks<Customer, CreateCustomerDto>(
 customersApi,
 queryKeys.customers
)

export const useCustomers = customerHooks.useList
export const useCustomer = customerHooks.useDetail
export const useCreateCustomer = customerHooks.useCreate
export const useUpdateCustomer = customerHooks.useUpdate
export const useDeleteCustomer = customerHooks.useDelete
