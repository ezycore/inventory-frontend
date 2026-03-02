'use client'

import { useState } from 'react'
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
  label: string
  description: string
  icon: typeof Download
}[] = [
  {
    value: 'sales',
    label: 'Sales Data',
    description: 'Export all sales records for the selected period',
    icon: ShoppingCart,
  },
  {
    value: 'purchases',
    label: 'Purchase Data',
    description: 'Export all purchase orders for the selected period',
    icon: ShoppingBag,
  },
  {
    value: 'inventory',
    label: 'Inventory Data',
    description: 'Export current inventory stock levels',
    icon: Package,
  },
  {
    value: 'products',
    label: 'Products Data',
    description: 'Export all product information',
    icon: FileSpreadsheet,
  },
  {
    value: 'customers',
    label: 'Customer Data',
    description: 'Export all customer records',
    icon: Users,
  },
  {
    value: 'suppliers',
    label: 'Supplier Data',
    description: 'Export all supplier records',
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
          <h1 className="text-2xl font-bold tracking-tight">Export Data</h1>
          <p className="text-sm text-muted-foreground">
            Download your data as CSV files
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
                  <CardTitle className="text-base">{option.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  {option.description}
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
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
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
