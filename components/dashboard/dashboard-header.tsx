'use client'
// coding-standard: maintained

import { memo, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { formatInTimeZone } from 'date-fns-tz'
import { bn as bnDateLocale } from 'date-fns/locale'
import { getGreetingKey } from './helpers'
import { resolveTimezone } from '@/lib/org-calendar'
import { useFormatters } from '@/hooks/use-formatters'
import { Spinner } from '@/ui/components/spinner'

// ── Live Clock (isolated to prevent full-page re-renders) ──
const LiveClock = memo(function LiveClock({ timezone }: { timezone?: string }) {
  const { locale } = useFormatters()
  // Start null on BOTH server and client so the first (hydration) render matches
  // — a live clock's value inevitably differs between the SSR instant and the
  // hydration instant, so seeding a real Date here desyncs the two trees. The
  // effect fills in the time immediately after mount (client only).
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    const tick = () => setTime(new Date())
    // First tick deferred a task: keeps the hydration render null-matched and
    // avoids the synchronous setState-in-effect cascade lint errors on.
    const firstTick = setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(firstTick)
      clearInterval(id)
    }
  }, [])

  // formatInTimeZone applies the org timezone before date-fns renders it in
  // the active app locale (EEEE/MMMM localize automatically via the bn locale).
  const formatted = !time ? (
    <Spinner />
  ) : (
    formatInTimeZone(time, resolveTimezone(timezone), 'EEEE, MMMM d, yyyy, hh:mm:ss a', {
      locale: locale === 'bn' ? bnDateLocale : undefined,
    })
  )

  return <p className="font-medium tabular-nums">{formatted}</p>
})

interface DashboardHeaderProps {
  firstName: string
  timezone?: string
}

export function DashboardHeader({ firstName, timezone }: DashboardHeaderProps) {
  const t = useTranslations('dashboard')
  // The hour on the org's clock — the same zone as the time printed beside it.
  const hour = Number(formatInTimeZone(new Date(), resolveTimezone(timezone), 'H'))
  const greeting = t(`greeting.${getGreetingKey(hour)}`)

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline-last justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {t('title')}
        </h1>
        <p className="text-base text-muted-foreground">
          {greeting},{' '}
          <span className="font-semibold text-foreground">{firstName}</span>!
        </p>
      </div>
      <div className="self-start md:self-baseline-last text-right text-sm text-muted-foreground mt-1 sm:mt-0 shrink-0">
        <LiveClock timezone={timezone} />
      </div>
    </div>
  )
}
