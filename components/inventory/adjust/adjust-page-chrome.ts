// coding-standard: maintained
import { ClipboardEdit, ListChecks, SendHorizonal, Wallet } from 'lucide-react'
import type { StatData } from '@/ui/components/StatsCard'
import type { Translator } from '@/i18n/config'
import { formatCurrency } from '@/lib/currency'
import { itemValueDelta } from '@/components/inventory/adjust/adjustment-value'
import type { AdjustmentItem } from '@/services/stores/stock-adjustment-store'

/** The three-step header of the Adjust Stock page. `t` is bound to `inventory`. */
export function buildAdjustSteps(itemCount: number, t: Translator) {
  return [
    { label: t('shared.stepAddItems'), description: t('adjust.stepAddDesc') },
    {
      label: t('shared.stepReview'),
      description: t('shared.stepPendingCount', { count: itemCount }),
    },
    { label: t('shared.stepSubmit'), description: t('adjust.stepSubmitDesc') },
  ]
}

/**
 * Summary tiles over the pending adjustments: how many rows, units going up,
 * units going down, and the signed value the correction moves at cost.
 */
export function buildAdjustStats(
  items: AdjustmentItem[],
  t: Translator,
): StatData[] {
  const totalIncrease = items.reduce((sum, i) => {
    const diff = i.newQuantity - i.currentQuantity
    return diff > 0 ? sum + diff : sum
  }, 0)
  const totalDecrease = items.reduce((sum, i) => {
    const diff = i.newQuantity - i.currentQuantity
    return diff < 0 ? sum + Math.abs(diff) : sum
  }, 0)
  // Net value impact at cost (signed): what the correction adds to / removes
  // from stock value.
  const netValue = items.reduce((sum, i) => sum + itemValueDelta(i), 0)
  const netValueLabel = `${netValue < 0 ? '-' : '+'}${formatCurrency(Math.abs(netValue))}`

  return [
    {
      label: t('adjust.statPendingItems'),
      value: items.length,
      icon: ListChecks,
      variant: items.length > 0 ? 'primary' : 'default',
    },
    {
      label: t('adjust.statIncrease'),
      value: `+${totalIncrease}`,
      icon: ClipboardEdit,
      variant: 'success',
      description: t('adjust.statIncreaseDesc'),
    },
    {
      label: t('adjust.statDecrease'),
      value: `-${totalDecrease}`,
      icon: SendHorizonal,
      variant: totalDecrease > 0 ? 'destructive' : 'default',
      description: t('adjust.statDecreaseDesc'),
    },
    {
      label: t('adjust.statNetValue'),
      value: netValueLabel,
      icon: Wallet,
      variant:
        netValue > 0 ? 'success' : netValue < 0 ? 'destructive' : 'default',
      description: t('adjust.statNetValueDesc'),
    },
  ]
}
