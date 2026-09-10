'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { useCashReport } from '@/services/api'
import { Skeleton } from '@ui/components/skeleton'
import { useReportPeriod } from './use-report-period'
import { PeriodFilter } from '@/components/shared/period-filter'
import { CashSummaryCards } from './cash/cash-summary-cards'
import { CashAccountTable } from './cash/cash-account-table'
import {
  CashCategoryBreakdown,
  countCapitalEntries,
} from './cash/cash-category-breakdown'

/**
 * Cash flow for the period, split the way the ledger splits it: cash in, cash out, and owner
 * capital on its own. Before that split the tiles excluded equity while the category list below
 * them included it, so a ৳1,00,000 capital injection was listed under "Income" on a page whose
 * Income tile said ৳8,759.
 */
export function CashReport() {
  const t = useTranslations('reports.cash')
  const tEmpty = useTranslations('common.empty')
  const { period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd, params } =
    useReportPeriod()
  const { data, isLoading } = useCashReport(params)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <PeriodFilter
        period={period}
        setPeriod={setPeriod}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : data ? (
        <>
          <CashSummaryCards
            summary={data.summary}
            capitalCount={countCapitalEntries(data.categoryBreakdown)}
          />

          {data.accountBreakdown.length > 0 && (
            <CashAccountTable rows={data.accountBreakdown} />
          )}

          {data.categoryBreakdown.length > 0 && (
            <CashCategoryBreakdown rows={data.categoryBreakdown} />
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{tEmpty('noData')}</p>
      )}
    </div>
  )
}
