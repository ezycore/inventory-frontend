'use client'
// coding-standard: maintained

import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@ui/components/button'
import { Badge } from '@ui/components/badge'
import { Calendar, Info } from 'lucide-react'
import type { DashboardPeriod, DashboardOverview } from '@/services/api'
import type { AppLocale } from '@/i18n/config'
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
  const tPeriod = useTranslations('reports.period')
  const t = useTranslations('dashboard.period')
  const locale = useLocale() as AppLocale
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PERIOD_OPTIONS.map((opt) => (
        // Selected state is the `default` variant, not hand-rolled classes on
        // `outline`: that spelling inherited outline's `hover:text-foreground`,
        // which it never overrode, so hovering the selected pill flipped its
        // label to near-black on the green fill. Same spelling as
        // `reports/report-period-filter.tsx` — keep the two in step.
        <Button
          key={opt.value}
          variant={period === opt.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod(opt.value)}
          className="text-xs"
        >
          {opt.value === 'custom' && <Calendar className="h-3 w-3 mr-1" />}
          {tPeriod(opt.labelKey)}
        </Button>
      ))}
      {period === 'custom' && (
        <div className="flex items-center gap-2 ml-1">
          <DatePicker
            date={customStart}
            onSelect={setCustomStart}
            outputFormat="yyyy-MM-dd"
            timezone="Asia/Dhaka"
            placeholder={t('startDate')}
            className="w-40 h-8"
          />

          <span className="text-xs text-muted-foreground">{tPeriod('to')}</span>
          <DatePicker
            date={customEnd}
            onSelect={setCustomEnd}
            placeholder={t('endDate')}
            className='w-40 h-8'
            outputFormat="yyyy-MM-dd"
            timezone="Asia/Dhaka"
          />
        </div>
      )}
      {periodInfo && (
        <Badge variant="secondary" className="text-[11px] h-8 font-normal gap-1">
          <Info className="h-3 w-3" />
          {formatPeriodLabel(periodInfo, locale)}
        </Badge>
      )}
    </div>
  )
}
