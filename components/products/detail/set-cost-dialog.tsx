// coding-standard: maintained
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/components/dialog'
import { Label } from '@/ui/components/label'
import { NumberField } from '@/ui/components/number-field'
import { useSetProductCost } from '@/services/api'
import { getErrorMessage } from '@/lib/error-handling'

interface SetCostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  /** The variant tab the merchant is on; absent for a single product. */
  variantId?: string
  /** What the item sells for, so the dialog can show the profit per piece as they type. */
  sellingPrice: number
  /** The cost today — `0` means none entered. */
  currentCost: number
  formatCurrency: (n: number) => string
}

/**
 * Set a product's cost price after create (G4).
 *
 * Says plainly that the number applies to sales from now on: a sale keeps the cost it was made at,
 * so last month's profit does not move because today's cost did.
 */
export function SetCostDialog({
  open,
  onOpenChange,
  productId,
  variantId,
  sellingPrice,
  currentCost,
  formatCurrency,
}: SetCostDialogProps) {
  const t = useTranslations('products.products.detail.setCost')
  // Mounted per opening by the caller, so this starts from the cost on screen.
  const [cost, setCost] = useState<number | null>(currentCost > 0 ? currentCost : null)
  const mutation = useSetProductCost()

  const save = async () => {
    if (cost === null) return
    try {
      await mutation.mutateAsync({ id: productId, variantId: variantId ?? null, costPrice: cost })
      toast.success(t('saved'))
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error) || t('failed'))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="set-cost-price">{t('label')}</Label>
          <NumberField
            id="set-cost-price"
            value={cost}
            onChange={setCost}
            min={0}
            precision={2}
            placeholder="0.00"
            autoFocus
          />
          {cost !== null && cost > 0 && sellingPrice > 0 && (
            <p className="text-xs text-muted-foreground">
              {t('profitPreview', { amount: formatCurrency(sellingPrice - cost) })}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={save} disabled={cost === null || mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
