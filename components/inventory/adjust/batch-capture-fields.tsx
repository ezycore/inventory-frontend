"use client";
// coding-standard: maintained

import { useTranslations } from 'next-intl'
import { Input } from '@/ui/components/input'
import { Label } from '@/ui/components/label'
import { DatePicker } from '@/ui/components/date-picker'
import { BatchSelect } from '@/components/shared/batch-select'
import type { BatchTarget } from '@/components/inventory/adjust/use-adjust-stock'

interface BatchCaptureFieldsProps {
  productId: string
  variantId?: string | null
  target: BatchTarget
  onTargetChange: (target: BatchTarget) => void
  batchId: string
  onBatchIdChange: (batchId: string) => void
  expiryDate: string
  onExpiryDateChange: (date: string) => void
  batchNumber: string
  onBatchNumberChange: (batchNumber: string) => void
}

/**
 * Where added stock of an expiry-tracked product lands: a brand-new lot (needs
 * an expiry date) or an existing one (needs the lot chosen). The backend takes
 * exactly one of the two — topping up an existing lot instead of always minting
 * a new one is what stops one physical lot spawning duplicate batch rows.
 */
export function BatchCaptureFields({
  productId,
  variantId,
  target,
  onTargetChange,
  batchId,
  onBatchIdChange,
  expiryDate,
  onExpiryDateChange,
  batchNumber,
  onBatchNumberChange,
}: BatchCaptureFieldsProps) {
  const t = useTranslations('inventory.adjust')

  return (
    <div className="space-y-4 rounded-lg border border-dashed bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <Label>{t('batchTargetLabel')}</Label>
        <div className="inline-flex rounded-lg border p-0.5">
          {(['new', 'existing'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onTargetChange(option)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                target === option
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {option === 'new' ? t('batchTargetNew') : t('batchTargetExisting')}
            </button>
          ))}
        </div>
      </div>

      {target === 'existing' ? (
        <div className="space-y-1.5">
          <Label htmlFor="batchId">{t('batchExistingLabel')}</Label>
          <BatchSelect
            productId={productId}
            variantId={variantId}
            value={batchId || null}
            onChange={(id) => onBatchIdChange(id || '')}
          />
          <p className="text-xs text-muted-foreground">
            {t('batchExistingHint')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="expiryDate">
              {t('expiryDateLabel')}
              <span className="text-muted-foreground text-xs ml-2">
                {t('expiryForAddedStock')}
              </span>
            </Label>
            <DatePicker
              date={expiryDate || undefined}
              onSelect={(d) => onExpiryDateChange(d ?? '')}
              className="h-11"
              placeholder={t('pickExpiryDate')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="batchNumber">
              {t('batchNumber')}{' '}
              <span className="text-muted-foreground text-xs">
                {t('batchNumberOptional')}
              </span>
            </Label>
            <Input
              id="batchNumber"
              value={batchNumber}
              onChange={(e) => onBatchNumberChange(e.target.value)}
              placeholder={t('batchPlaceholder')}
              className="h-11"
            />
          </div>
        </div>
      )}
    </div>
  )
}
