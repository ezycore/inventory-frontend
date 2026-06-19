'use client'

import { useState } from 'react'
import { useExpiringBatches, useExpiredBatches } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Skeleton } from '@ui/components/skeleton'
import { Badge } from '@ui/components/badge'
import { AlertTriangle, CalendarClock, PackageX, Boxes } from 'lucide-react'

const DAY_OPTIONS = [7, 15, 30, 60, 90]

function formatDate(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10)
}

function daysUntil(value: string | Date) {
  const ms = new Date(value).getTime() - Date.now()
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}

interface BatchRow {
  _id: string
  batchNumber?: string
  expiryDate: string
  remainingQuantity: number
  productId?: { name?: string } | null
  locationId?: { name?: string } | null
}

function BatchTable({
  rows,
  emptyText,
  tone,
}: {
  rows: BatchRow[]
  emptyText: string
  tone: 'expired' | 'expiring'
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 font-medium">Product</th>
            <th className="pb-2 font-medium">Batch</th>
            <th className="pb-2 font-medium">Location</th>
            <th className="pb-2 font-medium">Expiry</th>
            <th className="pb-2 font-medium text-right">
              {tone === 'expired' ? 'Days overdue' : 'Days left'}
            </th>
            <th className="pb-2 font-medium text-right">Qty</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => {
            const left = daysUntil(b.expiryDate)
            return (
              <tr key={b._id} className="border-b last:border-0">
                <td className="py-2">{b.productId?.name || 'Unknown product'}</td>
                <td className="py-2">{b.batchNumber || '-'}</td>
                <td className="py-2">{b.locationId?.name || '-'}</td>
                <td className="py-2">{formatDate(b.expiryDate)}</td>
                <td className="py-2 text-right">
                  <Badge
                    variant={tone === 'expired' ? 'destructive' : 'secondary'}
                  >
                    {tone === 'expired' ? Math.abs(left) : left}
                  </Badge>
                </td>
                <td className="py-2 text-right font-medium">
                  {b.remainingQuantity.toLocaleString()}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function ExpiryReport() {
  const [days, setDays] = useState(30)

  const { data: expiringResp, isLoading: loadingExpiring } = useExpiringBatches({
    days,
    limit: 200,
  })
  const { data: expiredResp, isLoading: loadingExpired } = useExpiredBatches({
    limit: 200,
  })

  const expiring: BatchRow[] = (expiringResp?.data as any)?.items || []
  const expired: BatchRow[] = (expiredResp?.data as any)?.items || []

  const expiringUnits = expiring.reduce((s, b) => s + (b.remainingQuantity || 0), 0)
  const expiredUnits = expired.reduce((s, b) => s + (b.remainingQuantity || 0), 0)

  const isLoading = loadingExpiring || loadingExpired

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expiry Report</h1>
          <p className="text-sm text-muted-foreground">
            Batches that have expired or are expiring soon at this location
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="expiry-window" className="text-sm text-muted-foreground">
            Expiring within
          </label>
          <select
            id="expiry-window"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d} days
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Expired Batches</CardTitle>
                <PackageX className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expired.length}</div>
                <p className="text-xs text-muted-foreground">Past expiry, still in stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Expired Units</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expiredUnits.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Quantity to write off</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expiring.length}</div>
                <p className="text-xs text-muted-foreground">Within {days} days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Expiring Units</CardTitle>
                <Boxes className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expiringUnits.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Quantity at risk</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Expired</CardTitle>
            </CardHeader>
            <CardContent>
              <BatchTable
                rows={expired}
                tone="expired"
                emptyText="No expired stock. 🎉"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expiring within {days} days</CardTitle>
            </CardHeader>
            <CardContent>
              <BatchTable
                rows={expiring}
                tone="expiring"
                emptyText="Nothing expiring in this window."
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
