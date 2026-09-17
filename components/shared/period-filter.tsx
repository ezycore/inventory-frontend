'use client'
// coding-standard: maintained

import { useLocale, useTranslations } from 'next-intl'
import { Calendar, Info } from 'lucide-react'
import { Badge } from '@ui/components/badge'
import { Button } from '@ui/components/button'
import { SimpleSelect } from '@ui/components/simple-select'
import { DatePicker } from '@/ui/components/date-picker'
import { formatPeriodLabel } from '@/components/dashboard/helpers'
import { resolveTimezone } from '@/lib/org-calendar'
import { useAuthStore } from '@/services/stores/use-auth-store'
import type { AppLocale } from '@/i18n/config'

/**
 * The date-range control, for every screen that has one.
 *
 * There were two of these — `dashboard/period-filter.tsx` and
 * `reports/report-period-filter.tsx`, 156 lines between them across 20 call
 * sites — and the first carried a comment asking whoever came next to "keep the
 * two in step". They had already drifted: only the reports copy bounded the
 * custom pickers against each other, so the dashboard let a merchant pick an end
 * date before the start. This is that copy's behaviour, kept, plus the
 * dashboard's resolved-range badge, which the reports copy never had.
 *
 * The preset names are the server's own `PeriodKey` vocabulary
 * (`utils/applyDateFilter.ts`), so a pill maps to `period=<value>` with nothing in
 * between to translate.
 *
 * **Two renderings, one behaviour.** `PeriodFilter` spends a row on pills;
 * `PeriodSelect` spends one dropdown. Which to use is a fact about the row, not
 * about the screen — see each component.
 */

/** The presets every screen shares, in the order they read. */
export const PERIOD_VALUES = [
  'today',
  'thisWeek',
  'thisMonth',
  'last6Months',
  'lastYear',
  'custom',
] as const

export type PeriodValue = (typeof PERIOD_VALUES)[number]

/**
 * The clear-filter sentinel. **Not** a server period — the caller drops the
 * `period` param entirely when this is selected, which is what "no date filter"
 * means on the wire.
 */
export const ALL_TIME = 'all'

interface PeriodControlProps<P extends string> {
  period: P
  /**
   * `NoInfer` so the period type is read from `period` alone. A `useState`
   * setter is `Dispatch<SetStateAction<P>>`, whose parameter is
   * `P | ((prev: P) => P)` — offered as an inference site it widens `P` to that
   * union and every caller then fails to match its own state type.
   */
  setPeriod: (p: NoInfer<P>) => void
  customStart: string
  setCustomStart: (v: string) => void
  customEnd: string
  setCustomEnd: (v: string) => void
  /**
   * Prepend an **All time** option.
   *
   * Off by default, because a summary screen legitimately opens on "today". A
   * WORK QUEUE must not: the orders list exists to show what is outstanding, and
   * one that opened on today would hide every unshipped order from last week
   * behind a filter the merchant never chose.
   */
  includeAllTime?: boolean
  /**
   * Overrides the zone the custom pickers resolve a picked day in.
   *
   * Defaults to the signed-in ORGANIZATION's timezone, read here rather than
   * passed by each screen. Never a hardcoded zone: an org in `America/New_York`
   * and one in `Asia/Dhaka` do not share a day boundary, and the server resolves
   * `period` against that same org field (`applyDateFilter.extractDateContext`),
   * so a constant here would disagree with the range that comes back.
   *
   * Defaulted in the component and not at the call site because the call site is
   * what forgets: the dashboard's own copy of this filter hardcoded `Asia/Dhaka`
   * and the reports copy passed nothing, which is exactly the drift that merging
   * them was meant to end.
   *
   * **Currently inert for this control**, and threaded anyway. `DatePicker`
   * applies `timezone` only when `outputFormat` carries time parts, and
   * `yyyy-MM-dd` is date-only — a picked calendar day is already zone-safe by
   * construction. The wiring is here so the day this control needs a timestamp,
   * it reads the org's zone instead of the browser's.
   */
  timezone?: string
}

interface PeriodFilterProps<P extends string> extends PeriodControlProps<P> {
  /** The resolved range, shown as a badge. Only some responses carry one. */
  periodInfo?: { key: string; startDate: string; endDate: string }
}

/** The caller's zone wins; otherwise the org's own. See `timezone` above. */
function useResolvedZone(timezone?: string): string | undefined {
  // Left `undefined` when the org has none set, which lets `DatePicker` fall
  // back to the browser — a wrong-but-local day beats forcing every workspace
  // to UTC.
  const orgTimezone = useAuthStore((s) => s.user?.organization?.timezone)
  return timezone ?? orgTimezone
}

/** The presets in reading order, translated, with `all` prepended on request. */
function usePeriodOptions(includeAllTime: boolean) {
  const t = useTranslations('reports.period')
  return [
    ...(includeAllTime ? [ALL_TIME] : []),
    ...PERIOD_VALUES,
  ].map((value) => ({ value, label: t(value === ALL_TIME ? 'allTime' : value) }))
}

/**
 * The from/to pair, shared by both renderings so the cross-bounds cannot drift
 * back apart — a forked copy missing them is the original bug this file exists
 * to have fixed.
 */
function CustomRange({
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  zone,
}: {
  customStart: string
  setCustomStart: (v: string) => void
  customEnd: string
  setCustomEnd: (v: string) => void
  zone?: string
}) {
  const t = useTranslations('reports.period')
  return (
    <div className="flex items-center gap-2">
      {/* Bounded against each other, so an end before the start is not
          selectable in the first place rather than rejected afterwards. */}
      <DatePicker
        date={customStart || undefined}
        onSelect={(d) => setCustomStart(d ?? '')}
        toDate={customEnd ? new Date(customEnd) : undefined}
        outputFormat="yyyy-MM-dd"
        timezone={zone}
        placeholder={t('start')}
        className="h-8 w-auto text-xs"
      />
      <span className="text-xs text-muted-foreground">{t('to')}</span>
      <DatePicker
        date={customEnd || undefined}
        onSelect={(d) => setCustomEnd(d ?? '')}
        fromDate={customStart ? new Date(customStart) : undefined}
        outputFormat="yyyy-MM-dd"
        timezone={zone}
        placeholder={t('end')}
        className="h-8 w-auto text-xs"
      />
    </div>
  )
}

/**
 * The pill rendering — every preset visible and one click away.
 *
 * Use it where the date range is the screen's PRIMARY control: reports, the
 * dashboard, transactions. Those pages have a row to spend and the merchant came
 * to change the period, so showing the whole vocabulary is the point.
 *
 * Where the period is one filter among several, use `PeriodSelect` instead.
 */
export function PeriodFilter<P extends string>({
  period,
  setPeriod,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  includeAllTime = false,
  periodInfo,
  timezone,
}: PeriodFilterProps<P>) {
  const locale = useLocale() as AppLocale
  const zone = useResolvedZone(timezone)
  const options = usePeriodOptions(includeAllTime)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((opt) => (
        // Selected state is the `default` variant, not hand-rolled classes on
        // `outline`: that spelling inherited outline's `hover:text-foreground`,
        // which it never overrode, so hovering the selected pill flipped its
        // label to near-black on the green fill.
        <Button
          key={opt.value}
          variant={period === opt.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod(opt.value as P)}
          className="text-xs"
        >
          {opt.value === 'custom' && <Calendar className="mr-1 h-3 w-3" />}
          {opt.label}
        </Button>
      ))}

      {period === 'custom' && (
        <div className="ml-1">
          <CustomRange
            customStart={customStart}
            setCustomStart={setCustomStart}
            customEnd={customEnd}
            setCustomEnd={setCustomEnd}
            zone={zone}
          />
        </div>
      )}

      {periodInfo && (
        <Badge variant="secondary" className="h-8 gap-1 text-[11px] font-normal">
          <Info className="h-3 w-3" />
          {formatPeriodLabel(periodInfo, locale, resolveTimezone(zone))}
        </Badge>
      )}
    </div>
  )
}

/**
 * The dropdown rendering — one `h-9` control, same width and height as the
 * filters beside it.
 *
 * Use it where the period is ONE FILTER AMONG SEVERAL. The orders list is the
 * case that produced it: seven pills went into a row that already held three
 * `w-40` selects and a `w-72` search box, ~1250px of controls in ~1100px of
 * space. It wrapped — and because the pill group wraps internally, it split
 * mid-group and left the search box landing in a different place depending on
 * how many pills happened to fit. The pills are also `size="sm"` against `h-9`
 * neighbours, so nothing in the row lined up.
 *
 * The custom range is revealed on demand rather than living in a popover.
 * Nesting `DatePicker`'s own popover inside another one puts the inner content
 * in a portal outside the outer's tree, where an outside-interaction handler
 * treats picking a date as a click away — the same seam that makes a `Select`
 * inside an `AlertDialog` worth checking by hand. Revealing it inline costs one
 * wrapped line in the state a merchant explicitly asked for, and nothing at all
 * the rest of the time.
 */
export function PeriodSelect<P extends string>({
  period,
  setPeriod,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  includeAllTime = false,
  timezone,
}: PeriodControlProps<P>) {
  const zone = useResolvedZone(timezone)
  const options = usePeriodOptions(includeAllTime)

  return (
    // Its own wrapping row, so the select and its revealed pickers travel as one
    // group when the parent filter bar wraps — rather than the pickers detaching
    // and stranding the select at the end of the line above.
    <div className="flex flex-wrap items-center gap-2">
      <SimpleSelect
        value={period}
        onValueChange={(v) => setPeriod(v as NoInfer<P>)}
        options={options}
        className="h-9 w-40"
      />
      {period === 'custom' && (
        <CustomRange
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
          zone={zone}
        />
      )}
    </div>
  )
}
