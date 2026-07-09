'use client'
// coding-standard: maintained

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
  const ctx = useAdjustStock()
  const {
    items,
    reason,
    setReason,
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
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Adjust Stock"
        subTitle="Correct stock counts after recounts, damage, or loss."
      />

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} compact />

      {/* Stats (shown when items exist) */}
      {items.length > 0 && (
        <StatsCard data={pendingStats} columns={{ default: 1, sm: 3 }} />
      )}

      {/* Add/Edit Item Card */}
      <AdjustmentFormCard ctx={ctx} />

      {/* Adjustment Reason (shown when items exist) */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-1.5">
              <Label htmlFor="reason">
                Adjustment Reason <span className="text-muted-foreground text-xs">(optional, applies to all items)</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for stock adjustment (e.g., physical count discrepancy, inventory audit, damage report...)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      {items.length > 0 && (
        <CardTable
          title={`Adjustment Items (${items.length})`}
          description="Review items before submitting. All adjustments are processed as a single transaction."
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
          emptyMessage="No items to adjust"
          actions={[
            {
              label: `Submit All (${items.length})`,
              onClick: handleSubmitAll,
              variant: 'default',
              loading: bulkAdjustMutation.isPending,
              disabled: bulkAdjustMutation.isPending,
              requiresConfirmation: true,
              confirmationTitle: 'Submit Stock Adjustments?',
              confirmationDescription: `This will adjust stock for ${items.length} item(s). This action processes as a single transaction and cannot be undone.`,
              confirmLabel: 'Submit All',
            },
          ]}
        />
      )}
    </div>
  )
}
