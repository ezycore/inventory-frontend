'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/card'
import { Button } from '@ui/components/button'
import { Skeleton } from '@ui/components/skeleton'
import ActivityTimeline, { type TimelineItem } from '@ui/components/ActivityTimeline'
import EmptyState from '@ui/components/EmptyState'
import { ArrowRight, ArrowDownToLine, ArrowUpFromLine, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { REASON_LABELS } from './helpers'

interface ActivitySectionProps {
  stockMovements?: any
  isLoading: boolean
}

export function ActivitySection({ stockMovements, isLoading }: ActivitySectionProps) {
  const router = useRouter()

  const timelineItems: TimelineItem[] = (
    stockMovements?.data?.items || []
  )
    .slice(0, 6)
    .map((m: any) => {
      const reasonLabel = REASON_LABELS[m.reason] || (m.movementType === 'in' ? 'Stock In' : 'Stock Out')
      const productName = m.productId?.name || 'Unknown Product'
      return {
        id: m._id,
        title: reasonLabel,
        description: `${productName} · ${m.quantity} units${m.notes ? ` · ${m.notes}` : ''}`,
        timestamp: m.createdAt
          ? format(new Date(m.createdAt), 'MMM d, h:mm a')
          : '',
        variant: (
          m.movementType === 'in' ? 'success' : 'destructive'
        ) as TimelineItem['variant'],
        icon: m.movementType === 'in' ? ArrowDownToLine : ArrowUpFromLine,
        meta: m.locationId?.name,
      }
    })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Latest stock movements</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => router.push('/inventory/movements')}
        >
          View All <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
            ))}
          </div>
        ) : timelineItems.length > 0 ? (
          <ActivityTimeline items={timelineItems} maxItems={5} />
        ) : (
          <EmptyState
            icon={RotateCcw}
            title="No recent activity"
            description="Stock movements will appear here"
            compact
          />
        )}
      </CardContent>
    </Card>
  )
}
