'use client'
// coding-standard: maintained

import { differenceInCalendarDays } from 'date-fns'
import { useTranslations } from 'next-intl'

import { Badge } from '@ui/components/badge'

/** Days from today until `expiryDate` — negative once the lot is past expiry. */
export function daysToExpiry(expiryDate: string | Date): number {
  return differenceInCalendarDays(new Date(expiryDate), new Date())
}

/**
 * True once the lot is past its expiry date (a draw from it books as a write-off).
 *
 * Mirrors the server rule exactly (`stock-batch.service.ts` `isBatchExpired`:
 * `expiryDate != null && new Date(expiryDate) < now`) — an instant comparison,
 * not a calendar-day one. Deriving this from `daysToExpiry() < 0` instead would
 * call a lot dated today "0 days left" while the backend already books a draw
 * from it as `MovementReason.EXPIRY` — the two would disagree for a whole day.
 *
 * The null guard is load-bearing: `new Date(null)` is the Unix epoch, so a bare
 * comparison reports the unknown-expiry lot as long expired — which would write
 * off good stock and exclude it from every sale.
 */
export function isExpired(expiryDate: string | null | undefined): boolean {
  return expiryDate != null && new Date(expiryDate) < new Date()
}

/**
 * Shelf-life badge for a stock lot: unknown / expired / near (≤30d) / ok.
 *
 * Shared because the inventory detail batch table and the adjust-stock batch
 * draw picker must agree on when a lot reads as "expired" — they sit on either
 * side of the same decision (see it expiring, then write it off), so two
 * thresholds would be a bug the user notices before we do.
 *
 * The unknown-expiry lot gets a badge of its own rather than a dash: it is a
 * real lot the user can act on (see the Assign column on stock detail), and a
 * blank cell reads as missing data — hiding the one lot most likely to go off
 * unnoticed.
 */
export function ExpiryBadge({ expiryDate }: { expiryDate?: string | null }) {
  const t = useTranslations('inventory.expiry')

  if (expiryDate == null) return <Badge variant="outline">{t('unknown')}</Badge>
  if (isExpired(expiryDate)) return <Badge variant="destructive">{t('expired')}</Badge>

  const days = daysToExpiry(expiryDate)
  if (days <= 30)
    return <Badge className="bg-amber-100 text-amber-700">{t('daysLeft', { days })}</Badge>
  return <Badge variant="secondary">{t('daysLeft', { days })}</Badge>
}
