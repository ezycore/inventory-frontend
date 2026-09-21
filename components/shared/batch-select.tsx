"use client";
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { useProductBatches } from '@/services/api'
import type { BatchRow } from '@/services/api/modules/inventory/analytics.types'
import { useFormatters } from '@/hooks/use-formatters'
import { SimpleSelect, type SimpleSelectOption } from '@/ui/components/simple-select'
import { isExpired } from '@/components/shared/expiry/expiry-badge'

/**
 * A lot is past its expiry. Expired stock is excluded from sale but stays
 * on-hand for write-off, so pickers must show it rather than hide it.
 *
 * Delegates to the shared `isExpired` so the picker and the ExpiryBadge cannot
 * drift to two thresholds — this is only the `BatchRow`-shaped wrapper.
 */
export const isBatchExpired = (batch: BatchRow, timezone: string): boolean =>
  isExpired(batch.expiryDate, timezone)

/**
 * A lot with `expiryDate: null` is the **unknown-expiry lot** — stock that
 * arrived without a date. It is an ordinary lot in every respect except that it
 * never expires and sorts last in FEFO, so it has to read as a real thing the
 * user can point at and act on. Rendering a blank makes it look like missing
 * data and hides the one lot that most needs attention.
 *
 * The label is a UI concern only: `batchNumber` and `expiryDate` stay `null` in
 * the data, because both are part of the unique lot-merge key on the server and
 * a literal would have to be written identically at every write site or one lot
 * would split into several.
 */
export const isUnknownExpiry = (batch: BatchRow): boolean => !batch.expiryDate

/** `inventory.batch`-bound translator → the lot's batch-number cell. */
export const batchNumberLabel = (
  batch: BatchRow,
  t: (key: string) => string,
): string => batch.batchNumber || t('unknownBatch')

/** `inventory.batch`-bound translator → the lot's expiry cell. */
export const expiryLabel = (
  batch: BatchRow,
  t: (key: string) => string,
  formatDate: (value: string) => string,
): string =>
  batch.expiryDate ? formatDate(batch.expiryDate) : t('unknownExpiry')

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
  const { formatDateOnly, timezone } = useFormatters()
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
    // The unknown lot gets its own templates rather than an "Exp {expiry}" row
    // with a stand-in phrase inside it, which reads as "Exp no expiry date".
    const base = isUnknownExpiry(batch)
      ? batch.batchNumber
        ? t('optionUnknownWithLot', {
            lot: batch.batchNumber,
            left: batch.remainingQuantity,
          })
        : t('optionUnknown', { left: batch.remainingQuantity })
      : batch.batchNumber
        ? t('optionWithLot', {
            expiry: formatDateOnly(batch.expiryDate as string, 'dd MMM yyyy'),
            lot: batch.batchNumber,
            left: batch.remainingQuantity,
          })
        : t('option', {
            expiry: formatDateOnly(batch.expiryDate as string, 'dd MMM yyyy'),
            left: batch.remainingQuantity,
          })
    return isBatchExpired(batch, timezone) ? t('expiredPrefix', { label: base }) : base
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
