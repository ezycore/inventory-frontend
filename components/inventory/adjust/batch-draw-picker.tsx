"use client";
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/ui/components/button'
import { Label } from '@/ui/components/label'
import { NumberField } from '@/ui/components/number-field'
import { BatchSelect } from '@/components/shared/batch-select'
import type { BatchDraw } from '@/services/stores/stock-adjustment-store'

interface BatchDrawPickerProps {
  productId: string
  variantId?: string | null
  draws: BatchDraw[]
  onChange: (draws: BatchDraw[]) => void
  /** Units the adjustment removes — the draws have to add up to this. */
  removedQuantity: number
  unitName?: string
}

/**
 * Chooses which lots a stock decrease comes out of. An expiry-tracked product
 * keeps `Inventory.quantity` equal to the sum of its batches, so the backend
 * rejects a decrease that does not say where the units left from.
 *
 * Rows are pre-filled expired-first then FEFO by the page hook — a write-off is
 * usually clearing exactly the stock that has gone off.
 */
export function BatchDrawPicker({
  productId,
  variantId,
  draws,
  onChange,
  removedQuantity,
  unitName,
}: BatchDrawPickerProps) {
  const t = useTranslations('inventory.adjust')
  const allocated = draws.reduce((sum, d) => sum + (d.quantity || 0), 0)
  const balanced = allocated === removedQuantity
  const chosenIds = draws.map((d) => d.batchId).filter(Boolean) as string[]

  const update = (index: number, patch: Partial<BatchDraw>) =>
    onChange(draws.map((d, i) => (i === index ? { ...d, ...patch } : d)))

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-red-400/60 bg-red-50/40 dark:bg-red-950/20 p-4">
      <div className="flex items-center justify-between">
        <Label>{t('drawFromBatches')}</Label>
        <span
          className={`text-xs font-medium tabular-nums ${
            balanced ? 'text-green-600' : 'text-red-500'
          }`}
        >
          {t('drawAllocated', {
            allocated,
            required: removedQuantity,
            unit: unitName || '',
          })}
        </span>
      </div>

      {draws.map((draw, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <BatchSelect
              productId={productId}
              variantId={variantId}
              value={draw.batchId || null}
              onChange={(batchId) => update(index, { batchId: batchId || '' })}
              excludeIds={chosenIds}
              className="h-11 w-full rounded-md border bg-background px-2 text-sm"
            />
          </div>
          <div className="w-28 shrink-0">
            <NumberField
              precision={0}
              min={0}
              value={draw.quantity}
              onChange={(v) => update(index, { quantity: Math.max(0, v ?? 0) })}
              placeholder={t('drawQuantity')}
              className="h-11"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-9 shrink-0 text-destructive hover:text-destructive"
            onClick={() => onChange(draws.filter((_, i) => i !== index))}
            disabled={draws.length === 1}
            aria-label={t('drawRemoveRow')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => onChange([...draws, { batchId: '', quantity: 0 }])}
      >
        <Plus className="h-3.5 w-3.5" />
        {t('drawAddBatch')}
      </Button>

      <p className="text-xs text-muted-foreground">{t('drawHint')}</p>
    </div>
  )
}
