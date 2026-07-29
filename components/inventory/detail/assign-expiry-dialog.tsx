'use client'
// coding-standard: maintained

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/components/dialog'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Label } from '@ui/components/label'
import { useAssignBatchExpiry } from '@/services/api'
import type { BatchRow } from '@/services/api/modules/inventory/analytics.types'

interface AssignExpiryDialogProps {
  batch: BatchRow
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Give undated stock a date — the unknown-expiry lot's way out.
 *
 * Stock arrives without paperwork often enough that the unknown lot is normal,
 * not exceptional. What is not acceptable is that it be permanent: undated stock
 * never appears in an expiry report, never alerts, and sorts last in FEFO
 * forever, so it quietly becomes the stock most likely to go off unnoticed.
 *
 * **Nothing moves off the shelf.** The same units simply stop being described as
 * undated: the server leaves `Inventory.quantity` alone and writes no stock
 * movement. The copy says so, because "assign expiry" could otherwise read like
 * a transfer or a write-off.
 */
export function AssignExpiryDialog({
  batch,
  open,
  onOpenChange,
}: AssignExpiryDialogProps) {
  const t = useTranslations('inventory.batch')
  const tActions = useTranslations('common.actions')
  const assign = useAssignBatchExpiry()

  const [quantity, setQuantity] = useState(String(batch.remainingQuantity))
  const [expiryDate, setExpiryDate] = useState('')
  const [batchNumber, setBatchNumber] = useState('')

  const parsedQuantity = Number(quantity)
  const quantityValid =
    Number.isInteger(parsedQuantity) &&
    parsedQuantity > 0 &&
    parsedQuantity <= batch.remainingQuantity
  const canSubmit = quantityValid && !!expiryDate && !assign.isPending

  // A past date is allowed on purpose — finding out that undated stock went off
  // last month is exactly when someone reaches for this — but it is worth
  // saying out loud, because the lot becomes write-off material immediately.
  const isPastDate = !!expiryDate && new Date(expiryDate) < new Date()

  const submit = async () => {
    if (!canSubmit) return
    await assign.mutateAsync({
      batchId: batch._id,
      quantity: parsedQuantity,
      expiryDate,
      ...(batchNumber.trim() ? { batchNumber: batchNumber.trim() } : {}),
    })
    toast.success(t('assignSuccess', { quantity: parsedQuantity }))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('assignExpiryTitle')}</DialogTitle>
          <DialogDescription>{t('assignExpiryHelp')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="assign-quantity">{t('assignQuantity')}</Label>
            <Input
              id="assign-quantity"
              type="number"
              min={1}
              max={batch.remainingQuantity}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {t('assignQuantityMax', { max: batch.remainingQuantity })}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assign-expiry">{t('assignExpiryDate')}</Label>
            <Input
              id="assign-expiry"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
            {isPastDate && (
              <p className="text-xs text-amber-600">{t('assignPastDateNote')}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assign-batch-number">{t('assignBatchNumber')}</Label>
            <Input
              id="assign-batch-number"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              maxLength={64}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tActions('cancel')}
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {t('assignSubmit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
