"use client";
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { useProductBatches } from '@/services/api'
import type { BatchRow } from '@/services/api/modules/inventory/analytics.types'
import { useFormatters } from '@/hooks/use-formatters'

/**
 * A lot is past its expiry. Expired stock is excluded from sale but stays
 * on-hand for write-off, so pickers must show it rather than hide it.
 */
export const isBatchExpired = (batch: BatchRow): boolean =>
  !!batch.expiryDate && new Date(batch.expiryDate) < new Date()

interface BatchSelectProps {
  productId: string
  variantId?: string | null
  value: string | null
  onChange: (batchId: string | null) => void
  /**
   * Renders a leading blank option with this label (e.g. "Auto (FEFO)").
   * Omit when the caller needs a concrete lot chosen.
   */
  emptyLabel?: string
  /** Lots to hide — already claimed by a sibling row. */
  excludeIds?: string[]
  /** Skip the request entirely (e.g. the product is not expiry-tracked). */
  enabled?: boolean
  disabled?: boolean
  title?: string
  className?: string
}

/**
 * Lot picker for expiry-tracked products, backed by the expiry read API.
 * Shared by the POS cart (which sells from a lot) and stock adjustment (which
 * writes stock off a lot) — the option label must read the same in both.
 */
export function BatchSelect({
  productId,
  variantId,
  value,
  onChange,
  emptyLabel,
  excludeIds = [],
  enabled = true,
  disabled,
  title,
  className = 'h-9 w-full rounded-md border bg-background px-2 text-xs',
}: BatchSelectProps) {
  const t = useTranslations('inventory.batch')
  const { formatDate } = useFormatters()
  const { data, isLoading } = useProductBatches(
    productId,
    { ...(variantId ? { variantId } : {}) },
    { enabled },
  )

  const batches: BatchRow[] = (data?.data as BatchRow[]) || []
  // The currently chosen lot stays listed even if excluded elsewhere, else the
  // select would fall back to showing a blank for a value that is really set.
  const options = batches.filter(
    (b) => b._id === value || !excludeIds.includes(b._id),
  )

  const labelFor = (batch: BatchRow) => {
    const expiry = batch.expiryDate
      ? formatDate(batch.expiryDate, 'dd MMM yyyy')
      : t('noExpiryDate')
    const base = batch.batchNumber
      ? t('optionWithLot', {
          expiry,
          lot: batch.batchNumber,
          left: batch.remainingQuantity,
        })
      : t('option', { expiry, left: batch.remainingQuantity })
    return isBatchExpired(batch) ? t('expiredPrefix', { label: base }) : base
  }

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled || isLoading}
      className={className}
      title={title}
    >
      {emptyLabel !== undefined ? (
        <option value="">{emptyLabel}</option>
      ) : (
        <option value="">{t('choosePlaceholder')}</option>
      )}
      {options.map((batch) => (
        <option key={batch._id} value={batch._id}>
          {labelFor(batch)}
        </option>
      ))}
    </select>
  )
}
