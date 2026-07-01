'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/card'
import { Button } from '@ui/components/button'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart,
  ArrowDownToLine,
  Package,
  Repeat,
  BarChart3,
  Eye,
} from 'lucide-react'

const ACTIONS = [
  {
    label: 'New Sale',
    icon: ShoppingCart,
    path: '/sales',
    color: 'text-primary',
  },
  {
    label: 'Purchase',
    icon: ArrowDownToLine,
    path: '/purchases',
    color: 'text-chart-2',
  },
  {
    label: 'Add Product',
    icon: Package,
    path: '/products',
    color: 'text-chart-4',
  },
  // {
  //   label: 'Transfer Stock',
  //   icon: Repeat,
  //   path: '/stock/transfers',
  //   color: 'text-chart-5',
  // },
  {
    label: 'Stock Adjust',
    icon: BarChart3,
    path: '/inventory/adjust',
    color: 'text-chart-1',
  },
  {
    label: 'View Reports',
    icon: Eye,
    path: '/dashboard/reports/inventory',
    color: 'text-muted-foreground',
  },
]

export function QuickActions() {
  const router = useRouter()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
        <CardDescription>Jump to common tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {ACTIONS.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 hover:shadow-sm transition-shadow"
              onClick={() => router.push(action.path)}
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
