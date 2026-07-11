'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { useInventoryReport } from '@/services/api'
import { useCurrency } from '@/lib/currency'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { useReportPeriod } from './use-report-period'
import { ReportPeriodFilter } from './report-period-filter'
import {
  Package,
  AlertTriangle,
  XCircle,
  Database,
} from 'lucide-react'

/** Stock-status slug → `reports.inventory.status*` message key. */
const STATUS_LABEL_KEYS: Record<string, string> = {
  'in-stock': 'statusInStock',
  'low-stock': 'statusLowStock',
  'out-of-stock': 'statusOutOfStock',
}

export function InventoryReport() {
  const t = useTranslations('reports.inventory')
  const tEmpty = useTranslations('common.empty')
  const { period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd, params } =
    useReportPeriod()
  const { data, isLoading } = useInventoryReport(params)
  const { format: formatCurrency } = useCurrency()

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
                <CardTitle className="text-sm font-medium">{t('totalProducts')}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  {t('totalItemsInStock', { count: data.summary.totalItems })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('stockValue')}</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.summary.totalValue)}
                </div>
                <p className="text-xs text-muted-foreground">{t('totalInventoryCostValue')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('lowStock')}</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {data.summary.lowStockCount}
                </div>
                <p className="text-xs text-muted-foreground">{t('itemsBelowAlert')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t('outOfStock')}</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {data.summary.outOfStockCount}
                </div>
                <p className="text-xs text-muted-foreground">{t('itemsZeroQty')}</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('byCategory')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.categoryBreakdown.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{tEmpty('noData')}</p>
                  ) : (
                    data.categoryBreakdown.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{cat.categoryName}</span>
                          <span className="ml-2 text-muted-foreground">
                            {t('productsCount', { count: cat.productCount })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(cat.totalValue)}</span>
                          <span className="ml-2 text-muted-foreground">
                            {t('qtySuffix', { count: cat.totalQuantity })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stock Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>{t('stockStatus')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.stockStatusBreakdown.map((status, i) => {
                    const colors: Record<string, string> = {
                      'in-stock': 'text-green-600',
                      'low-stock': 'text-yellow-600',
                      'out-of-stock': 'text-red-600',
                    }
                    return (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div>
                          <span className={`font-medium capitalize ${colors[status.status] || ''}`}>
                            {STATUS_LABEL_KEYS[status.status] ? t(STATUS_LABEL_KEYS[status.status]) : status.status.replace('-', ' ')}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            {t('productsCount', { count: status.count })}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium">{formatCurrency(status.totalValue)}</span>
                          <span className="ml-2 text-muted-foreground">
                            {t('qtySuffix', { count: status.totalQuantity })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{tEmpty('noData')}</p>
      )}
    </div>
  )
}
