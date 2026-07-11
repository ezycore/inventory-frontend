// coding-standard: maintained
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

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

/** Format an ISO date to `yyyy-MM-dd`, falling back to the raw string. */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd')
  } catch {
    return dateStr
  }
}

/**
 * Format an ISO instant in the org's IANA timezone (so the displayed day matches
 * the dashboard). Falls back to browser-local when no tz is supplied.
 */
export function formatDateTz(
  dateStr: string | undefined,
  timezone?: string,
  fmt = 'MMM d, yyyy · HH:mm',
): string {
  if (!dateStr) return '—'
  try {
    return timezone
      ? formatInTimeZone(new Date(dateStr), timezone, fmt)
      : format(new Date(dateStr), fmt)
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
