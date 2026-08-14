'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@ui/components/card'
import { Lock } from 'lucide-react'

/**
 * Shown in place of the dashboard's reporting panels for a role without
 * `reports.view`.
 *
 * The panels used to render anyway, off a silent 403: every figure read ৳0.00
 * and the charts said "No transaction data yet". That is worse than showing
 * nothing — a cashier has no way to tell "you cannot see this" from "the shop
 * sold nothing today", and the second reading is alarming and wrong. Say which
 * one it is.
 */
export function ReportsRestricted() {
  const t = useTranslations('dashboard.restricted')

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <div className="rounded-full bg-muted p-3">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="font-medium">{t('title')}</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t('description')}
        </p>
      </CardContent>
    </Card>
  )
}
