// coding-standard: maintained
import { formatInTimeZone } from 'date-fns-tz'
import { resolveTimezone } from '@/lib/org-calendar'

/** One inventory row for a product at a single location. */
export interface InventoryItem {
  _id: string
  productId: string
  variantId?: string | null
  locationId: string
  quantity: number
  quantityAlert: number
  isLowStock: boolean
  location?: { _id: string; name: string }
  shelf?: string
}

/**
 * Format an ISO instant in the org's IANA timezone (so the displayed day matches
 * the dashboard). A missing tz resolves to the default org zone, never the browser's.
 */
export function formatDateTz(
  dateStr: string | undefined,
  timezone?: string,
  fmt = 'MMM d, yyyy · HH:mm',
): string {
  if (!dateStr) return '—'
  try {
    return formatInTimeZone(new Date(dateStr), resolveTimezone(timezone), fmt)
  } catch {
    return dateStr
  }
}

/** Quantity badge color thresholds (high / medium / low). */
export function getQuantityColor(qty: number): string {
  if (qty >= 50) return 'bg-emerald-100 text-emerald-700'
  if (qty >= 20) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-700'
}
