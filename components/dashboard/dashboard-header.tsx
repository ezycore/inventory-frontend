'use client'

import { memo, useEffect, useState } from 'react'
import { getGreetingMessage } from './helpers'
import { Spinner } from '@/ui/components/spinner'

// ── Live Clock (isolated to prevent full-page re-renders) ──
const LiveClock = memo(function LiveClock({ timezone }: { timezone?: string }) {
  // `null` on the server AND the hydration render (a `typeof window` lazy
  // initializer would make the first client render differ from the SSR HTML —
  // a hydration mismatch). The clock starts one frame after hydration.
  const [time, setTime] = useState<Date | null>(null)

  useEffect(() => {
    const tick = () => setTime(new Date())
    const raf = requestAnimationFrame(tick)
    const id = setInterval(tick, 1000)
    return () => {
      cancelAnimationFrame(raf)
      clearInterval(id)
    }
  }, [])

  const formatted = !time ? <Spinner /> :  time.toLocaleString('en-US', {
    timeZone: timezone || 'Asia/Dhaka',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  return <p className="font-medium tabular-nums">{formatted}</p>
})

interface DashboardHeaderProps {
  firstName: string
  timezone?: string
}

export function DashboardHeader({ firstName, timezone }: DashboardHeaderProps) {
  const hour = new Date().getHours()
  const greeting = getGreetingMessage(hour)

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline-last justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Dashboard
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
