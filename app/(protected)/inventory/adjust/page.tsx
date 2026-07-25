'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { useHydrated } from '@/hooks/use-hydrated'
import { Button } from '@/ui/components/button'
import { Card, CardContent } from '@/ui/components/card'
import { Label } from '@/ui/components/label'
import { Textarea } from '@/ui/components/textarea'
import { CardTable } from '@/ui/components/custom/card-table'
import { Trash } from 'lucide-react'
import PageHeader from '@/ui/components/header'
import StepIndicator from '@/ui/components/StepIndicator'
import StatsCard from '@/ui/components/StatsCard'
import { useAdjustStock } from '@/components/inventory/adjust/use-adjust-stock'
import { AdjustmentFormCard } from '@/components/inventory/adjust/adjustment-form-card'
import { getAdjustmentColumns } from '@/components/inventory/adjust/columns'

export default function StockAdjustmentPage() {
  const t = useTranslations('inventory')
  const hydrated = useHydrated()
  const ctx = useAdjustStock()
  const {
    items,
    reason,
    setReason,
    defaultUnit,
    setDefaultUnit,
    clearAll,
    removeItem,
    editingId,
    handleEdit,
    handleSubmitAll,
    bulkAdjustMutation,
    currentStep,
    steps,
    pendingStats,
  } = ctx

  const columns = getAdjustmentColumns({
    editingId,
    onEdit: handleEdit,
    onRemove: removeItem,
    t,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('adjust.title')}
        subTitle={t('adjust.subtitle')}
      />

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} compact />

      {/* Stats (shown when items exist) */}
      {items.length > 0 && (
        <StatsCard data={pendingStats} columns={{ default: 1, sm: 2, lg: 4 }} />
      )}

      {/* Default input unit for UOM products (remembered per user) */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">
          {t('adjust.defaultUnitLabel')}
        </span>
        <div className="inline-flex rounded-lg border p-0.5">
          <Button
            size="sm"
            variant={(hydrated ? defaultUnit : 'base') === 'base' ? 'default' : 'ghost'}
            onClick={() => setDefaultUnit('base')}
            className="h-7"
          >
            {t('adjust.unitBase')}
          </Button>
          <Button
            size="sm"
            variant={(hydrated ? defaultUnit : 'base') === 'purchase' ? 'default' : 'ghost'}
            onClick={() => setDefaultUnit('purchase')}
            className="h-7"
          >
            {t('adjust.unitPurchase')}
          </Button>
        </div>
      </div>

      {/* Add/Edit Item Card */}
      <AdjustmentFormCard ctx={ctx} />

      {/* Adjustment Reason (shown when items exist) */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1.5">
              <Label htmlFor="reason">
                {t('adjust.reasonLabel')}{' '}
                <span className="text-muted-foreground text-xs">{t('adjust.reasonOptionalHint')}</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('adjust.reasonPlaceholder')}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      {items.length > 0 && (
        <CardTable
          title={t('adjust.itemsTitle', { count: items.length })}
          description={t('adjust.itemsDescription')}
          headerAction={
            <Button
              variant="destructive"
              size="icon"
              onClick={clearAll}
              title={t('shared.clearAllItems')}
            >
              <Trash className="h-4 w-4" />
            </Button>
          }
          columns={columns}
          data={items}
          emptyMessage={t('adjust.emptyItems')}
          actions={[
            {
              label: t('shared.submitAll', { count: items.length }),
              onClick: handleSubmitAll,
              variant: 'default',
              loading: bulkAdjustMutation.isPending,
              disabled: bulkAdjustMutation.isPending,
              requiresConfirmation: true,
              confirmationTitle: t('adjust.confirmTitle'),
              confirmationDescription: t('adjust.confirmDescription', { count: items.length }),
              confirmLabel: t('shared.submitAllLabel'),
            },
          ]}
        />
      )}
    </div>
  )
}
