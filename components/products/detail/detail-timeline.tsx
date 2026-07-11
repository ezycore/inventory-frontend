// coding-standard: maintained
'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Clock } from 'lucide-react'
import { formatDate } from './utils'

interface DetailTimelineProps {
  createdAt?: string
  updatedAt?: string
}

export function DetailTimeline({ createdAt, updatedAt }: DetailTimelineProps) {
  const t = useTranslations('products.products.detail.timeline')
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-emerald-600" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{t('created')}</span>
            <span className="text-sm font-medium">{formatDate(createdAt)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">{t('lastUpdated')}</span>
            <span className="text-sm font-medium">{formatDate(updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
