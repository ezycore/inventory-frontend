// coding-standard: maintained
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/services/api'
import { invalidate } from '@/services/api/invalidation'
import { createResourceHooks } from '../query-helpers'
import { queryKeys } from '@/services/api/query-keys'
import { CreateProductDto } from '@/types'
import type { ProductDetail, ProductListItem } from '@/types/api'

const productHooks = createResourceHooks<ProductDetail, CreateProductDto, Partial<CreateProductDto>, ProductListItem>(
  productsApi,
  queryKeys.products,
  // The sellable/purchasable pickers are `/inventory/*` endpoints, so they live
  // under the inventory root — `catalog.changed` carries it.
  { events: ["catalog.changed"] },
)

export const useProductStats = productHooks.useStats
export const useProducts = productHooks.useList
export const useProduct = productHooks.useDetail
export const useProductBySlug = productHooks.useBySlug!
export const useCreateProduct = productHooks.useCreate
export const useUpdateProduct = productHooks.useUpdate
export const useDeleteProduct = productHooks.useDelete

/**
 * Bulk taxonomy edits touch product rows, the per-tag / per-category product
 * counts and the storefront's collection pages — all of it `catalog.changed`.
 */
export const useBulkUpdateProducts = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productsApi.bulkUpdate,
    onSuccess: () => invalidate(qc, 'catalog.changed'),
  })
}

/** A cost edit moves the product page's cost, profit and stock value — `catalog.changed`. */
export const useSetProductCost = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; variantId?: string | null; costPrice: number }) =>
      productsApi.setCost(id, body),
    onSuccess: () => invalidate(qc, 'catalog.changed'),
  })
}

/** The Cost prices screen's rows. */
export const useProductCosts = () =>
  useQuery({
    queryKey: queryKeys.products.costs(),
    queryFn: productsApi.listCosts,
    select: (res) => res.data,
  })

/** Save many costs at once — the same `catalog.changed` as one product's cost. */
export const useSetProductCosts = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productsApi.setCosts,
    onSuccess: () => invalidate(qc, 'catalog.changed'),
  })
}

/** The Sold counts screen's rows. */
export const useProductSoldCounts = () =>
  useQuery({
    queryKey: queryKeys.products.soldCounts(),
    queryFn: productsApi.listSoldCounts,
    select: (res) => res.data,
  })

/** Save opening sold counts. The storefront's chip reads them on its next page build. */
export const useSetProductSoldCounts = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productsApi.setSoldCounts,
    onSuccess: () => invalidate(qc, 'catalog.changed'),
  })
}

export const useMatchProductList = () =>
  useMutation({ mutationFn: productsApi.matchList })

export const useCommitTaxonomySheet = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: productsApi.taxonomyCommit,
    onSuccess: () => invalidate(qc, 'catalog.changed'),
  })
}
