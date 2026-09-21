'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'

import { useOrgCalendar } from '@/hooks/use-org-calendar'
import { daysUntilDateOnly, isExpiryPast } from '@/lib/org-calendar'
import { Badge } from '@ui/components/badge'

/**
 * Calendar days from the ORG's today until `expiryDate` — `0` on the expiry day
 * itself (its last valid day), negative once the lot is past expiry.
 */
export function daysToExpiry(expiryDate: string | Date, timezone: string): number {
  return daysUntilDateOnly(expiryDate, timezone)
}

/**
 * True once the lot is past its expiry date (a draw from it books as a write-off).
 *
 * Mirrors the server rule exactly (`isBatchExpired` / `isPastExpiry` in
 * `utils/expiry-date.ts`): a lot is good through the WHOLE of its expiry date on
 * the organization's calendar and expires when that local day ends. So it agrees
 * with `daysToExpiry() < 0` by construction — a lot dated today reads
 * "0 days left" and is still sellable on both sides.
 *
 * The null guard is load-bearing: `new Date(null)` is the Unix epoch, so a bare
 * comparison reports the unknown-expiry lot as long expired — which would write
 * off good stock and exclude it from every sale.
 */
export function isExpired(expiryDate: string | null | undefined, timezone: string): boolean {
  return isExpiryPast(expiryDate, timezone)
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
  const { timezone } = useOrgCalendar()

  if (expiryDate == null) return <Badge variant="outline">{t('unknown')}</Badge>
  if (isExpired(expiryDate, timezone)) return <Badge variant="destructive">{t('expired')}</Badge>

  const days = daysToExpiry(expiryDate, timezone)
  if (days <= 30)
    return <Badge className="bg-amber-100 text-amber-700">{t('daysLeft', { days })}</Badge>
  return <Badge variant="secondary">{t('daysLeft', { days })}</Badge>
}
