"use client";
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { useProductBatches } from '@/services/api'
import type { BatchRow } from '@/services/api/modules/inventory/analytics.types'
import { useFormatters } from '@/hooks/use-formatters'
import { SimpleSelect, type SimpleSelectOption } from '@/ui/components/simple-select'

/**
 * A lot is past its expiry. Expired stock is excluded from sale but stays
 * on-hand for write-off, so pickers must show it rather than hide it.
 */
export const isBatchExpired = (batch: BatchRow): boolean =>
  !!batch.expiryDate && new Date(batch.expiryDate) < new Date()

/**
 * Radix rejects an empty-string item value, so "no specific lot" needs a
 * sentinel. It never leaves this file — `onChange` maps it back to null.
 */
const NO_BATCH = '__no_batch__'

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
  className = 'h-11 w-full',
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
  const visible = batches.filter(
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

  const options: SimpleSelectOption[] = [
    ...(emptyLabel !== undefined
      ? [{ label: emptyLabel, value: NO_BATCH }]
      : []),
    ...visible.map((batch) => ({ label: labelFor(batch), value: batch._id })),
  ]

  return (
    <SimpleSelect
      value={value ?? (emptyLabel !== undefined ? NO_BATCH : undefined)}
      onValueChange={(next) => onChange(next === NO_BATCH ? null : next)}
      options={options}
      placeholder={t('choosePlaceholder')}
      emptyMessage={t('noBatches')}
      disabled={disabled || isLoading}
      title={title}
      className={className}
    />
  )
}
