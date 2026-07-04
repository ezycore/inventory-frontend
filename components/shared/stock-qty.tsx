// coding-standard: maintained
import { Badge } from '@ui/components/badge'
import { cn } from '@ui/lib/utils'

/**
 * Amber "N expired" chip. Renders nothing when there's no expired stock, so it
 * can be dropped into any layout unconditionally. Shared by every screen that
 * shows a product quantity (sale/purchase pickers, inventory list + detail,
 * product detail). See backend utils/expired-stock.
 */
export function ExpiredBadge({
  count,
  className,
}: {
  count?: number
  className?: string
}) {
  if (!count || count <= 0) return null
  return (
    <Badge
      variant="secondary"
      className={cn('border-0 bg-amber-100 font-semibold text-amber-700', className)}
    >
      {count.toLocaleString()} expired
    </Badge>
  )
}

interface StockQtyProps {
  /** Authoritative on-hand quantity. */
  total: number
  /** Sellable = total − expired; defaults to total when not supplied. */
  sellable?: number
  /** Expired on-hand; 0/undefined => plain total, no split shown. */
  expired?: number
  unit?: string
  className?: string
}

/**
 * Sellable-first stock display: `sellable / total (+ expired chip)` when any
 * stock is expired, else the plain total — so non-expiry products stay clean.
 */
export function StockQty({ total, sellable, expired, unit, className }: StockQtyProps) {
  const exp = expired ?? 0
  const sell = sellable ?? total
  const suffix = unit ? ` ${unit}` : ''

  if (exp <= 0) {
    return (
      <span className={className}>
        {total.toLocaleString()}
        {suffix}
      </span>
    )
  }

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-2', className)}>
      <span>
        <span className="font-semibold">{sell.toLocaleString()}</span>
        <span className="text-muted-foreground">
          {' '}
          / {total.toLocaleString()}
          {suffix}
        </span>
      </span>
      <ExpiredBadge count={exp} />
    </span>
  )
}
