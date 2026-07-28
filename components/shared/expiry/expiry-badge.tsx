'use client'
// coding-standard: maintained

import { differenceInCalendarDays } from 'date-fns'
import { useTranslations } from 'next-intl'

import { Badge } from '@ui/components/badge'

/** Days from today until `expiryDate` — negative once the lot is past expiry. */
export function daysToExpiry(expiryDate: string | Date): number {
  return differenceInCalendarDays(new Date(expiryDate), new Date())
}

/** True once the lot is past its expiry date (a draw from it books as a write-off). */
export function isExpired(expiryDate: string | null | undefined): boolean {
  return !!expiryDate && daysToExpiry(expiryDate) < 0
}

/**
 * Shelf-life badge for a stock lot: expired / near (≤30d) / ok.
 *
 * Shared because the inventory detail batch table and the adjust-stock batch
 * draw picker must agree on when a lot reads as "expired" — they sit on either
 * side of the same decision (see it expiring, then write it off), so two
 * thresholds would be a bug the user notices before we do.
 */
export function ExpiryBadge({ expiryDate }: { expiryDate?: string | null }) {
  const t = useTranslations('inventory.expiry')

  if (!expiryDate) return <span className="text-muted-foreground">—</span>

  const days = daysToExpiry(expiryDate)
  if (days < 0) return <Badge variant="destructive">{t('expired')}</Badge>
  if (days <= 30)
    return <Badge className="bg-amber-100 text-amber-700">{t('daysLeft', { days })}</Badge>
  return <Badge variant="secondary">{t('daysLeft', { days })}</Badge>
}
