import type { DashboardPeriod } from '@/services/api'
import { format } from 'date-fns'

// ── Period Options ──
export const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'last6Months', label: '6 Months' },
  { value: 'lastYear', label: '1 Year' },
  { value: 'custom', label: 'Custom' },
]

// ── Readable reason labels ──
export const REASON_LABELS: Record<string, string> = {
  sale: 'Sale',
  purchase: 'Purchase Received',
  adjustment: 'Stock Adjustment',
  transfer: 'Stock Transfer',
  return: 'Return',
  opening_stock: 'Opening Stock',
}

// ── Greeting message based on time of day ──
export function getGreetingMessage(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
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
): string {
  if (!periodInfo) return ''
  const start = new Date(periodInfo.startDate)
  const end = new Date(periodInfo.endDate)
  // endDate is exclusive upper bound, show day before
  end.setDate(end.getDate() - 1)
  const sameDay = start.toDateString() === end.toDateString()
  if (sameDay) return format(start, 'MMM d, yyyy')
  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()
  if (sameMonth) return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`
  if (sameYear) return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`
}
