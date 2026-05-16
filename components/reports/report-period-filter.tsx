'use client'

import { Button } from '@ui/components/button'
import { Calendar } from 'lucide-react'
import type { ReportPeriod } from '@/services/api/modules/reports/api'

const PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'last6Months', label: '6 Months' },
  { value: 'lastYear', label: '1 Year' },
  { value: 'custom', label: 'Custom' },
]

interface ReportPeriodFilterProps {
  period: ReportPeriod
  setPeriod: (p: ReportPeriod) => void
  customStart: string
  setCustomStart: (v: string) => void
  customEnd: string
  setCustomEnd: (v: string) => void
}

export function ReportPeriodFilter({
  period,
  setPeriod,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
}: ReportPeriodFilterProps) {
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
    </div>
  )
}
