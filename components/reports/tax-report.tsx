'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { useTaxReport } from '@/services/api'
import { useCurrency } from '@/lib/currency'
import { useAuthStore } from '@/services/stores'
import { isVatActive } from '@/lib/feature-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { useReportPeriod } from './use-report-period'
import { PeriodFilter } from '@/components/shared/period-filter'
import { TaxRateTable } from './tax-rate-table'
import { TaxTrendChart } from './tax-trend-chart'
import { TaxLedgerTable } from './tax-ledger-table'
import { ArrowDownCircle, ArrowUpCircle, Scale } from 'lucide-react'

export function TaxReport() {
  const t = useTranslations('reports.tax')
  const tEmpty = useTranslations('common.empty')
  const { user } = useAuthStore()
  const taxOn =
    isVatActive(user?.organization) ||
    isVatActive(user?.organization)

  const { period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd, params } =
    useReportPeriod()
  const { data, isLoading } = useTaxReport(params, taxOn)
  const { format: formatCurrency } = useCurrency()

  const payable = data ? data.netPayable : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      {!taxOn ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t('notEnabled')}
          </CardContent>
        </Card>
      ) : (
        <>
          <PeriodFilter
            period={period}
            setPeriod={setPeriod}
            customStart={customStart}
            setCustomStart={setCustomStart}
            customEnd={customEnd}
            setCustomEnd={setCustomEnd}
          />

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : data ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Output tax (sales) */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{t('outputTax')}</CardTitle>
                    <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.output.net)}</div>
                    <p className="text-xs text-muted-foreground">
                      {t('collectedRefunded', {
                        collected: formatCurrency(data.output.collected),
                        refunded: formatCurrency(data.output.refunded),
                      })}
                    </p>
                  </CardContent>
                </Card>

                {/* Input tax (purchases) */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{t('inputTax')}</CardTitle>
                    <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.input.net)}</div>
                    <p className="text-xs text-muted-foreground">
                      {t('paidReclaimed', {
                        paid: formatCurrency(data.input.paid),
                        reclaimed: formatCurrency(data.input.reclaimed),
                      })}
                    </p>
                    {/* Only a standard-rated registrant may reclaim this. For
                        everyone else it is a cost, and saying so is the whole
                        point — the old report implied a rebate they cannot claim. */}
                    {!data.input.recoverable && (
                      <p className="mt-1 text-xs text-amber-600">
                        {t('inputNotRecoverable')}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Net payable */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{t('netPayable')}</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        payable > 0 ? 'text-red-600' : payable < 0 ? 'text-green-600' : ''
                      }`}
                    >
                      {formatCurrency(Math.abs(payable))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {payable > 0
                        ? t('payableToAuthority')
                        : payable < 0
                          ? t('reclaimableCredit')
                          : t('nothingPayable')}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <p className="text-xs text-muted-foreground leading-snug">
                {data.input.recoverable
                  ? t('explainerStandard')
                  : t('explainerNoRebate')}
              </p>

              <TaxTrendChart data={data.chart} formatCurrency={formatCurrency} />

              <TaxRateTable
                output={data.byRate.output}
                input={data.byRate.input}
                formatCurrency={formatCurrency}
              />

              <TaxLedgerTable params={params} enabled={taxOn} formatCurrency={formatCurrency} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{tEmpty('noData')}</p>
          )}
        </>
      )}
    </div>
  )
}
