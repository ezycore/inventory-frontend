'use client'
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { Button } from '@/ui/components/button'
import { Alert, AlertDescription, AlertTitle } from '@/ui/components/alert'
import { CardTable } from '@/ui/components/custom/card-table'
import { Info, Trash } from 'lucide-react'
import PageHeader from '@/ui/components/header'
import StepIndicator from '@/ui/components/StepIndicator'
import StatsCard from '@/ui/components/StatsCard'
import { useTransferStock } from '@/components/inventory/transfers/use-transfer-stock'
import { TransferFormCard } from '@/components/inventory/transfers/transfer-form-card'
import { getTransferColumns } from '@/components/inventory/transfers/columns'

export default function BulkStockTransferPage() {
  const t = useTranslations('inventory')
  const ctx = useTransferStock()
  const {
    items,
    clearAll,
    removeItem,
    editingId,
    handleEdit,
    handleSubmitAll,
    bulkTransferMutation,
    locationsLoading,
    locationCount,
    fromLocationName,
    toLocationName,
    totalUnits,
    currentStep,
    steps,
    pendingStats,
  } = ctx

  const columns = getTransferColumns({
    editingId,
    onEdit: handleEdit,
    onRemove: removeItem,
    t,
  })

  // Single-location guard
  if (!locationsLoading && locationCount <= 1) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('transfers.title')}
          subTitle={t('transfers.subtitle')}
        />
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>{t('transfers.notAvailableTitle')}</AlertTitle>
          <AlertDescription>
            {t('transfers.notAvailableBody', { count: locationCount })}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('transfers.title')}
        subTitle={t('transfers.subtitle')}
      />

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} compact />

      {/* Stats (shown when items exist) */}
      {items.length > 0 && (
        <StatsCard data={pendingStats} columns={{ default: 1, sm: 3 }} />
      )}

      {/* Transfer Card */}
      <TransferFormCard ctx={ctx} />

      {/* Items Table */}
      {items.length > 0 && (
        <CardTable
          title={t('transfers.itemsTitle', { count: items.length })}
          description={t('transfers.itemsDescription', {
            from: fromLocationName,
            to: toLocationName,
          })}
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
          emptyMessage={t('transfers.emptyItems')}
          actions={[
            {
              label: t('shared.submitAll', { count: items.length }),
              onClick: handleSubmitAll,
              variant: 'default',
              loading: bulkTransferMutation.isPending,
              disabled: bulkTransferMutation.isPending,
              requiresConfirmation: true,
              confirmationTitle: t('transfers.confirmTitle'),
              confirmationDescription: t('transfers.confirmDescription', {
                units: totalUnits,
                count: items.length,
                from: fromLocationName,
                to: toLocationName,
              }),
              confirmLabel: t('shared.submitAllLabel'),
            },
          ]}
        />
      )}
    </div>
  )
}
