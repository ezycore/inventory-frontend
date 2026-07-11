'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
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
    labelKey: 'newSale',
    icon: ShoppingCart,
    path: '/sales',
    color: 'text-primary',
  },
  {
    labelKey: 'purchase',
    icon: ArrowDownToLine,
    path: '/purchases',
    color: 'text-chart-2',
  },
  {
    labelKey: 'addProduct',
    icon: Package,
    path: '/products',
    color: 'text-chart-4',
  },
  {
    labelKey: 'transferStock',
    icon: Repeat,
    path: '/inventory/transfers',
    color: 'text-chart-5',
  },
  {
    labelKey: 'adjustStock',
    icon: BarChart3,
    path: '/inventory/adjust',
    color: 'text-chart-1',
  },
  {
    labelKey: 'viewReports',
    icon: Eye,
    path: '/reports',
    color: 'text-muted-foreground',
  },
]

export function QuickActions() {
  const router = useRouter()
  const t = useTranslations('dashboard.quickActions')

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('title')}</CardTitle>
        <CardDescription>{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {ACTIONS.map((action) => (
            <Button
              key={action.labelKey}
              variant="outline"
              className="h-auto py-3 px-3 flex flex-col items-center gap-1.5 hover:shadow-sm transition-shadow"
              onClick={() => router.push(action.path)}
            >
              <action.icon className={`h-5 w-5 ${action.color}`} />
              <span className="text-xs font-medium">{t(action.labelKey)}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
