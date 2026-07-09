'use client'
// coding-standard: maintained

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
  })

  // Single-location guard
  if (!locationsLoading && locationCount <= 1) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Transfer Stock"
          subTitle="Move stock from one location to another."
        />
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Stock Transfer Not Available</AlertTitle>
          <AlertDescription>
            Stock transfer requires at least two locations. You currently have{' '}
            {locationCount === 0 ? 'no locations' : 'only one location'} configured.
            Please add more locations before using this feature.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transfer Stock"
        subTitle="Move stock from one location to another."
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
          title={`Transfers to Process (${items.length})`}
          description={`${fromLocationName} → ${toLocationName} · Review items before submitting.`}
          headerAction={
            <Button
              variant="destructive"
              size="icon"
              onClick={clearAll}
              title="Clear all items"
            >
              <Trash className="h-4 w-4" />
            </Button>
          }
          columns={columns}
          data={items}
          emptyMessage="No transfers to process"
          actions={[
            {
              label: `Submit All (${items.length})`,
              onClick: handleSubmitAll,
              variant: 'default',
              loading: bulkTransferMutation.isPending,
              disabled: bulkTransferMutation.isPending,
              requiresConfirmation: true,
              confirmationTitle: 'Process Stock Transfers?',
              confirmationDescription: `This will transfer ${totalUnits} unit(s) across ${items.length} product(s) from ${fromLocationName} to ${toLocationName}. This action cannot be undone.`,
              confirmLabel: 'Submit All',
            },
          ]}
        />
      )}
    </div>
  )
}
