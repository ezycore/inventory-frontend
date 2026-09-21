// coding-standard: maintained
import type { DashboardPeriod } from '@/services/api'
import { formatInTimeZone } from 'date-fns-tz'
import { bn as bnDateLocale } from 'date-fns/locale'
import type { AppLocale } from '@/i18n/config'

// ── Period Options — labelKey resolves against `reports.period.*` (shared vocab) ──
export const PERIOD_OPTIONS: { value: DashboardPeriod; labelKey: string }[] = [
  { value: 'today', labelKey: 'today' },
  { value: 'thisWeek', labelKey: 'thisWeek' },
  { value: 'thisMonth', labelKey: 'thisMonth' },
  { value: 'last6Months', labelKey: 'last6Months' },
  { value: 'lastYear', labelKey: 'lastYear' },
  { value: 'custom', labelKey: 'custom' },
]

// ── Readable reason labels — labelKey resolves against `dashboard.activity.reason*` ──
export const REASON_LABEL_KEYS: Record<string, string> = {
  sale: 'reasonSale',
  purchase: 'reasonPurchaseReceived',
  adjustment: 'reasonStockAdjustment',
  transfer: 'reasonStockTransfer',
  return: 'reasonReturn',
  opening_stock: 'reasonOpeningStock',
}

// ── Greeting message key based on time of day (resolves against `dashboard.greeting.*`) ──
export function getGreetingKey(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

// ── % change helper ──
export function calcChange(
  current: number,
  previous: number,
): { value: number; direction: 'up' | 'down' | 'neutral' } {
  if (previous === 0 && current === 0) return { value: 0, direction: 'neutral' }
  if (previous === 0) return { value: 100, direction: 'up' }
  const pct = ((current - previous) / previous) * 100
  return {
    value: Math.abs(Math.round(pct)),
    direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral',
  }
}

// ── Format period date range for display ──
/**
 * The server's period instants, labelled on the ORGANIZATION's calendar: a Dhaka
 * "today" starts at 18:00Z the evening before, which a browser in another zone
 * would print as yesterday.
 */
export function formatPeriodLabel(
  periodInfo: { key: string; startDate: string; endDate: string } | undefined,
  locale: AppLocale,
  timezone: string,
): string {
  if (!periodInfo) return ''
  const opts = { locale: locale === 'bn' ? bnDateLocale : undefined }
  const start = new Date(periodInfo.startDate)
  // endDate is an exclusive instant (the next local midnight): the last day shown
  // is the one just before it.
  const end = new Date(new Date(periodInfo.endDate).getTime() - 1)
  const fmt = (date: Date, pattern: string) => formatInTimeZone(date, timezone, pattern, opts)
  const key = (date: Date, pattern: string) => formatInTimeZone(date, timezone, pattern)
  if (key(start, 'yyyy-MM-dd') === key(end, 'yyyy-MM-dd')) return fmt(start, 'MMM d, yyyy')
  const sameYear = key(start, 'yyyy') === key(end, 'yyyy')
  const sameMonth = sameYear && key(start, 'MM') === key(end, 'MM')
  if (sameMonth) return `${fmt(start, 'MMM d')} – ${fmt(end, 'd, yyyy')}`
  if (sameYear) return `${fmt(start, 'MMM d')} – ${fmt(end, 'MMM d, yyyy')}`
  return `${fmt(start, 'MMM d, yyyy')} – ${fmt(end, 'MMM d, yyyy')}`
}
