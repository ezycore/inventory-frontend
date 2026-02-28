'use client'

import { Button } from '@ui/components/button'
import { Badge } from '@ui/components/badge'
import { Calendar, Info } from 'lucide-react'
import type { DashboardPeriod, DashboardOverview } from '@/services/api'
import { PERIOD_OPTIONS, formatPeriodLabel } from './helpers'

interface PeriodFilterProps {
  period: DashboardPeriod
  setPeriod: (p: DashboardPeriod) => void
  customStart: string
  setCustomStart: (v: string) => void
  customEnd: string
  setCustomEnd: (v: string) => void
  periodInfo?: DashboardOverview['period']
}

export function PeriodFilter({
  period,
  setPeriod,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  periodInfo,
}: PeriodFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PERIOD_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant={period === opt.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod(opt.value)}
          className="text-xs"
        >
          {opt.value === 'custom' && <Calendar className="h-3 w-3 mr-1" />}
          {opt.label}
        </Button>
      ))}
      {period === 'custom' && (
        <div className="flex items-center gap-2 ml-1">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          />
        </div>
      )}
      {periodInfo && (
        <Badge variant="secondary" className="text-[11px] font-normal gap-1 ml-1">
          <Info className="h-3 w-3" />
          {formatPeriodLabel(periodInfo)}
        </Badge>
      )}
    </div>
  )
}
