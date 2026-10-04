'use client'
// coding-standard: maintained

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@ui/lib/utils'
import { quickActionLinkProps, type QuickAction } from './quick-action-items'

const FOCUS =
  'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

/**
 * New Sale is the brand-coloured tile, the order queue the near-black one, so
 * two primaries side by side stay distinct without a third accent. Near-black
 * in BOTH themes: `bg-foreground` inverted it into a white slab in dark mode,
 * the loudest thing on the page, with its white icon box gone against it.
 */
const primarySurface = (action: QuickAction) =>
  action.id === 'newSale'
    ? 'bg-primary text-primary-foreground'
    : 'bg-zinc-900 text-white dark:bg-zinc-800 dark:ring-1 dark:ring-inset dark:ring-white/10'

const hasCount = (count?: number): count is number => !!count && count > 0

/** Desktop: a big filled tile with a one-line hint and, when due, a count. */
export function PrimaryTile({
  action,
  label,
  hint,
  count,
  countLabel,
}: {
  action: QuickAction
  label: string
  hint: string
  count?: number
  countLabel: (count: number) => string
}) {
  return (
    <Link
      {...quickActionLinkProps(action)}
      className={cn(
        'flex items-center gap-4 rounded-xl px-5 py-4.5 transition-all hover:-translate-y-0.5 hover:shadow-md',
        primarySurface(action),
        FOCUS,
      )}
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-current/15">
        <action.icon className="size-6" aria-hidden />
      </span>
      <span className="flex grow flex-col gap-0.5">
        <span className="text-[19px] font-extrabold">{label}</span>
        <span className="text-[13px] opacity-85">{hint}</span>
      </span>
      {hasCount(count) ? (
        <span className="shrink-0 whitespace-nowrap rounded-full bg-warning px-3 py-1.5 text-[13px] font-bold text-black">
          {countLabel(count)}
        </span>
      ) : (
        <ArrowRight className="size-5.5" aria-hidden />
      )}
    </Link>
  )
}

/** Desktop: one cell of the shortcut row; turns amber while its count is due. */
export function ShortcutTile({
  action,
  label,
  count,
}: {
  action: QuickAction
  label: string
  count?: number
}) {
  const alert = hasCount(count)
  return (
    <Link
      {...quickActionLinkProps(action)}
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border px-2 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-sm',
        alert && 'border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/10',
        FOCUS,
      )}
    >
      <span className={cn('flex size-10 items-center justify-center rounded-lg', action.tint)}>
        <action.icon className="size-5" aria-hidden />
      </span>
      <span className="text-center text-[13px] font-semibold">
        {label}
        {alert && <span className="text-amber-700 dark:text-amber-300"> · {count}</span>}
      </span>
    </Link>
  )
}

/** Phone: the full-width button the first primary becomes. */
export function PhoneLeadButton({
  action,
  label,
  count,
}: {
  action: QuickAction
  label: string
  count?: number
}) {
  return (
    <Link
      {...quickActionLinkProps(action)}
      className={cn(
        'flex h-16 items-center gap-3.5 rounded-2xl px-4',
        primarySurface(action),
        FOCUS,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-current/15">
        <action.icon className="size-5" aria-hidden />
      </span>
      <span className="grow text-[17px] font-extrabold">{label}</span>
      {hasCount(count) && <CountBadge count={count} />}
      <ArrowRight className="size-5" aria-hidden />
    </Link>
  )
}

/** Phone: an app-style icon cell with its count pinned to the corner. */
export function PhoneGridTile({
  action,
  label,
  count,
}: {
  action: QuickAction
  label: string
  count?: number
}) {
  return (
    <Link
      {...quickActionLinkProps(action)}
      className={cn('flex flex-col items-center gap-2 rounded-xl', FOCUS)}
    >
      <span
        className={cn(
          'relative flex size-[54px] items-center justify-center rounded-[18px]',
          action.tint,
        )}
      >
        <action.icon className="size-6" aria-hidden />
        {hasCount(count) && (
          <CountBadge
            count={count}
            className="absolute -right-1.5 -top-1.5 border-2 border-card"
          />
        )}
      </span>
      <span className="text-center text-xs font-semibold leading-tight">{label}</span>
    </Link>
  )
}

function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        'flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-warning px-1.5 text-[11px] font-extrabold text-black',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
