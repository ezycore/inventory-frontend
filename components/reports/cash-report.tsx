'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { useCashReport } from '@/services/api'
import { useCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { useReportPeriod } from './use-report-period'
import { ReportPeriodFilter } from './report-period-filter'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  CreditCard,
} from 'lucide-react'

function calcChange(current: number, previous: number) {
  if (previous === 0 && current === 0) return { value: 0, direction: 'neutral' as const }
  if (previous === 0) return { value: 100, direction: 'up' as const }
  const pct = ((current - previous) / previous) * 100
  return {
    value: Math.abs(Math.round(pct)),
    direction: pct > 0 ? ('up' as const) : pct < 0 ? ('down' as const) : ('neutral' as const),
  }
}

export function CashReport() {
  const t = useTranslations('reports.cash')
  const tCommon = useTranslations('reports')
  const tEmpty = useTranslations('common.empty')
  const { period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd, params } =
    useReportPeriod()
  const { data, isLoading } = useCashReport(params)
  const { format: formatCurrency } = useCurrency()

  const incomeChange = data
    ? calcChange(data.summary.totalIncome, data.summary.previousIncome)
    : null
  const expenseChange = data
    ? calcChange(data.summary.totalExpense, data.summary.previousExpense)
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <ReportPeriodFilter
        period={period}
        setPeriod={setPeriod}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('totalBalance')}</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.summary.totalBalance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('acrossAccounts', { count: data.summary.accountCount })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('totalIncome')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.summary.totalIncome)}
                </div>
                {incomeChange && incomeChange.direction !== 'neutral' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {incomeChange.direction === 'up' ? (
                      <ArrowUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500" />
                    )}
                    {tCommon('vsPrevious', { value: incomeChange.value })}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('totalExpense')}</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.summary.totalExpense)}
                </div>
                {expenseChange && expenseChange.direction !== 'neutral' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {expenseChange.direction === 'up' ? (
                      <ArrowUp className="h-3 w-3 text-red-500" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-green-500" />
                    )}
                    {tCommon('vsPrevious', { value: expenseChange.value })}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('netCashFlow')}</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    data.summary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(data.summary.netCashFlow)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('transactionsCount', { count: data.summary.incomeCount + data.summary.expenseCount })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Account Breakdown */}
          {data.accountBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('accountBreakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left font-medium">{t('colAccount')}</th>
                        <th className="py-2 text-left font-medium">{t('colType')}</th>
                        <th className="py-2 text-right font-medium">{t('colBalance')}</th>
                        <th className="py-2 text-right font-medium">{t('colIncome')}</th>
                        <th className="py-2 text-right font-medium">{t('colExpense')}</th>
                        <th className="py-2 text-right font-medium">{t('colTransactions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.accountBreakdown.map((a, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 font-medium">{a.accountName}</td>
                          <td className="py-2 capitalize text-muted-foreground">
                            {a.accountType}
                          </td>
                          <td className="py-2 text-right">{formatCurrency(a.balance)}</td>
                          <td className="py-2 text-right text-green-600">
                            {formatCurrency(a.income)}
                          </td>
                          <td className="py-2 text-right text-red-600">
                            {formatCurrency(a.expense)}
                          </td>
                          <td className="py-2 text-right">{a.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category Breakdown */}
          {data.categoryBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('transactionCategories')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Income categories */}
                  <div>
                    <h3 className="text-sm font-semibold text-green-600 mb-3">{t('income')}</h3>
                    <div className="space-y-2">
                      {data.categoryBreakdown
                        .filter((c) => c.type === 'income')
                        .map((c, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{c.category.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <div>
                              <span className="font-medium">{formatCurrency(c.total)}</span>
                              <span className="ml-2 text-muted-foreground">({c.count})</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  {/* Expense categories */}
                  <div>
                    <h3 className="text-sm font-semibold text-red-600 mb-3">{t('expense')}</h3>
                    <div className="space-y-2">
                      {data.categoryBreakdown
                        .filter((c) => c.type === 'expense')
                        .map((c, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="capitalize">{c.category.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <div>
                              <span className="font-medium">{formatCurrency(c.total)}</span>
                              <span className="ml-2 text-muted-foreground">({c.count})</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{tEmpty('noData')}</p>
      )}
    </div>
  )
}
