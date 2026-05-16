'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/card'
import { Button } from '@ui/components/button'
import { Badge } from '@ui/components/badge'
import { Skeleton } from '@ui/components/skeleton'
import { Progress } from '@ui/components/progress'
import EmptyState from '@ui/components/EmptyState'
import { AlertTriangle, ArrowRight, Boxes, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { DashboardOverview } from '@/services/api'

interface LowStockAlertsProps {
  lowStock?: DashboardOverview['lowStock']
  isLoading: boolean
}

export function LowStockAlerts({ lowStock, isLoading }: LowStockAlertsProps) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-chart-1" />
            Low Stock Alerts
          </CardTitle>
          <CardDescription>Items needing restocking</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => router.push('/inventory/shortlist')}
        >
          View All <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-[140px]" />
                  <Skeleton className="h-3 w-[90px]" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : (lowStock?.items || []).length > 0 ? (
          <div className="space-y-3">
            {lowStock!.items.map((item) => {
              const percentage = item.alertThreshold > 0
                ? Math.min((item.currentStock / item.alertThreshold) * 100, 100)
                : 0
              return (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.productName}
                        {item.variantName ? ` — ${item.variantName}` : ''}
                      </p>
                      {item.sku && (
                        <p className="text-xs text-muted-foreground">
                          SKU: {item.sku}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={item.currentStock <= 0 ? 'destructive' : 'secondary'}
                      className="text-[10px] px-1.5 py-0 shrink-0 ml-2"
                    >
                      {item.currentStock} / {item.alertThreshold}
                    </Badge>
                  </div>
                  <Progress
                    value={percentage}
                    className="h-1.5"
                  />
                </div>
              )
            })}
            {(lowStock!.count + lowStock!.outOfStockCount) > lowStock!.items.length && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-1"
                onClick={() => router.push('/inventory/shortlist')}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View All {lowStock!.count + lowStock!.outOfStockCount} Items
              </Button>
            )}
          </div>
        ) : (
          <EmptyState
            icon={Boxes}
            title="All stock healthy"
            description="No items below threshold levels"
            compact
          />
        )}
      </CardContent>
    </Card>
  )
}
