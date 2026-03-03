'use client'

import { Button } from '@ui/components/button'
import { Badge } from '@ui/components/badge'
import { Calendar, Info } from 'lucide-react'
import type { DashboardPeriod, DashboardOverview } from '@/services/api'
import { PERIOD_OPTIONS, formatPeriodLabel } from './helpers'
import { DatePicker } from '@/ui/components/date-picker'

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
          <DatePicker
            date={customStart}
            onSelect={setCustomStart}
            format="yyyy-MM-dd"
            timezone="Asia/Dhaka"
            placeholder="Start date"
            className="w-40"
          />

          <span className="text-xs text-muted-foreground">to</span>
          <DatePicker
            date={customEnd}
            onSelect={setCustomEnd}
            placeholder="End date"
            className='w-40'
            format="yyyy-MM-dd"
            timezone="Asia/Dhaka"
          />
        </div>
      )}
      {periodInfo && (
        <Badge variant="secondary" className="text-[11px] h-8 font-normal gap-1 ml-1">
          <Info className="h-3 w-3" />
          {formatPeriodLabel(periodInfo)}
        </Badge>
      )}
    </div>
  )
}
