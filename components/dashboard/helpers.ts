// coding-standard: maintained
import type { DashboardPeriod } from '@/services/api'
import { format } from 'date-fns'
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
export function formatPeriodLabel(
  periodInfo?: { key: string; startDate: string; endDate: string },
  locale: AppLocale = 'en',
): string {
  if (!periodInfo) return ''
  const opts = { locale: locale === 'bn' ? bnDateLocale : undefined }
  const start = new Date(periodInfo.startDate)
  const end = new Date(periodInfo.endDate)
  // endDate is exclusive upper bound, show day before
  end.setDate(end.getDate() - 1)
  const sameDay = start.toDateString() === end.toDateString()
  if (sameDay) return format(start, 'MMM d, yyyy', opts)
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()
  if (sameMonth) return `${format(start, 'MMM d', opts)} – ${format(end, 'd, yyyy', opts)}`
  if (sameYear) return `${format(start, 'MMM d', opts)} – ${format(end, 'MMM d, yyyy', opts)}`
  return `${format(start, 'MMM d, yyyy', opts)} – ${format(end, 'MMM d, yyyy', opts)}`
}
