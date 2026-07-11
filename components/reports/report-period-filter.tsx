'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { Button } from '@ui/components/button'
import { DatePicker } from '@ui/components/date-picker'
import { Calendar } from 'lucide-react'
import type { ReportPeriod } from '@/services/api/modules/reports/api'

const PERIOD_KEYS: { value: ReportPeriod; labelKey: string }[] = [
  { value: 'today', labelKey: 'today' },
  { value: 'thisWeek', labelKey: 'thisWeek' },
  { value: 'thisMonth', labelKey: 'thisMonth' },
  { value: 'last6Months', labelKey: 'last6Months' },
  { value: 'lastYear', labelKey: 'lastYear' },
  { value: 'custom', labelKey: 'custom' },
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
  const t = useTranslations('reports.period')
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PERIOD_KEYS.map((opt) => (
        <Button
          key={opt.value}
          variant={period === opt.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod(opt.value)}
          className="text-xs"
        >
          {opt.value === 'custom' && <Calendar className="h-3 w-3 mr-1" />}
          {t(opt.labelKey)}
        </Button>
      ))}
      {period === 'custom' && (
        <div className="flex items-center gap-2 ml-1">
          <DatePicker
            date={customStart || undefined}
            onSelect={(d) => setCustomStart(d ?? '')}
            toDate={customEnd ? new Date(customEnd) : undefined}
            placeholder={t('start')}
            className="h-8 w-auto text-xs"
          />
          <span className="text-xs text-muted-foreground">{t('to')}</span>
          <DatePicker
            date={customEnd || undefined}
            onSelect={(d) => setCustomEnd(d ?? '')}
            fromDate={customStart ? new Date(customStart) : undefined}
            placeholder={t('end')}
            className="h-8 w-auto text-xs"
          />
        </div>
      )}
    </div>
  )
}
