'use client'
// coding-standard: maintained

import { useTaxReport } from '@/services/api'
import { useCurrency } from '@/lib/currency'
import { useAuthStore } from '@/services/stores'
import { isTaxActive } from '@/lib/feature-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { useReportPeriod } from './use-report-period'
import { ReportPeriodFilter } from './report-period-filter'
import { TaxRateTable } from './tax-rate-table'
import { TaxTrendChart } from './tax-trend-chart'
import { TaxLedgerTable } from './tax-ledger-table'
import { ArrowDownCircle, ArrowUpCircle, Scale } from 'lucide-react'

export function TaxReport() {
  const { user } = useAuthStore()
  const taxOn =
    isTaxActive(user?.organization, 'sales') ||
    isTaxActive(user?.organization, 'purchase')

  const { period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd, params } =
    useReportPeriod()
  const { data, isLoading } = useTaxReport(params, taxOn)
  const { format: formatCurrency } = useCurrency()

  const payable = data ? data.netPayable : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tax Report</h1>
        <p className="text-sm text-muted-foreground">
          Output tax, input tax, and net tax payable for the period
        </p>
      </div>

      {!taxOn ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Tax is not enabled for this organization. Enable it in Settings → Tax to see this report.
          </CardContent>
        </Card>
      ) : (
        <>
          <ReportPeriodFilter
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
                    <CardTitle className="text-sm font-medium">Output Tax (Sales)</CardTitle>
                    <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.output.net)}</div>
                    <p className="text-xs text-muted-foreground">
                      Collected {formatCurrency(data.output.collected)} · Refunded{' '}
                      {formatCurrency(data.output.refunded)}
                    </p>
                  </CardContent>
                </Card>

                {/* Input tax (purchases) */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Input Tax (Purchases)</CardTitle>
                    <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.input.net)}</div>
                    <p className="text-xs text-muted-foreground">
                      Paid {formatCurrency(data.input.paid)} · Reclaimed{' '}
                      {formatCurrency(data.input.reclaimed)}
                    </p>
                  </CardContent>
                </Card>

                {/* Net payable */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Net Tax Payable</CardTitle>
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
                        ? 'Payable to tax authority'
                        : payable < 0
                          ? 'Reclaimable credit'
                          : 'Nothing payable'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <p className="text-xs text-muted-foreground leading-snug">
                Net payable = Output tax (sales − sales returns) − Input tax (purchases −
                purchase returns). Positive means tax is owed to the authority; negative is a
                reclaimable credit. Drafts and cancelled documents are excluded.
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
            <p className="text-sm text-muted-foreground">No data available</p>
          )}
        </>
      )}
    </div>
  )
}
