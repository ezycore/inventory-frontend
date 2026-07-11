'use client'
// coding-standard: maintained

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useExportData, type ExportDataType } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Button } from '@ui/components/button'
import { Skeleton } from '@ui/components/skeleton'
import { useReportPeriod } from './use-report-period'
import { ReportPeriodFilter } from './report-period-filter'
import {
  Download,
  FileSpreadsheet,
  ShoppingCart,
  ShoppingBag,
  Package,
  Users,
  Truck,
} from 'lucide-react'

const EXPORT_OPTIONS: {
  value: ExportDataType
  labelKey: string
  descriptionKey: string
  icon: typeof Download
}[] = [
  {
    value: 'sales',
    labelKey: 'salesData',
    descriptionKey: 'salesDataDesc',
    icon: ShoppingCart,
  },
  {
    value: 'purchases',
    labelKey: 'purchaseData',
    descriptionKey: 'purchaseDataDesc',
    icon: ShoppingBag,
  },
  {
    value: 'inventory',
    labelKey: 'inventoryData',
    descriptionKey: 'inventoryDataDesc',
    icon: Package,
  },
  {
    value: 'products',
    labelKey: 'productsData',
    descriptionKey: 'productsDataDesc',
    icon: FileSpreadsheet,
  },
  {
    value: 'customers',
    labelKey: 'customerData',
    descriptionKey: 'customerDataDesc',
    icon: Users,
  },
  {
    value: 'suppliers',
    labelKey: 'supplierData',
    descriptionKey: 'supplierDataDesc',
    icon: Truck,
  },
]

function downloadCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return

  // Flatten nested objects for CSV
  const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    const result: Record<string, any> = {}
    for (const key of Object.keys(obj)) {
      const value = obj[key]
      const newKey = prefix ? `${prefix}_${key}` : key
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(result, flattenObject(value, newKey))
      } else if (Array.isArray(value)) {
        result[newKey] = JSON.stringify(value)
      } else {
        result[newKey] = value
      }
    }
    return result
  }

  const flatData = data.map((item) => flattenObject(item))
  const headers = [...new Set(flatData.flatMap((row) => Object.keys(row)))]
  const csvRows = [
    headers.join(','),
    ...flatData.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? ''
          const str = String(val)
          // Escape commas and quotes
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str
        })
        .join(','),
    ),
  ]

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function ExportData() {
  const t = useTranslations('reports.export')
  const { period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd, params } =
    useReportPeriod()
  const [selectedType, setSelectedType] = useState<ExportDataType | null>(null)
  const [triggerExport, setTriggerExport] = useState(false)

  const { data, isLoading, isFetching } = useExportData(
    selectedType || 'sales',
    params,
    triggerExport && !!selectedType,
  )

  const handleExport = (type: ExportDataType) => {
    setSelectedType(type)
    setTriggerExport(true)
  }

  // When data arrives, download it
  if (data && triggerExport && selectedType) {
    downloadCSV(data, selectedType)
    setTriggerExport(false)
  }

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXPORT_OPTIONS.map((option) => {
          const Icon = option.icon
          const isExporting = isFetching && selectedType === option.value && triggerExport

          return (
            <Card key={option.value}>
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base">{t(option.labelKey)}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t(option.descriptionKey)}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleExport(option.value)}
                  disabled={isExporting || !params}
                >
                  {isExporting ? (
                    <>
                      <Skeleton className="mr-2 h-4 w-4 animate-spin rounded-full" />
                      {t('exporting')}
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      {t('exportCsv')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
