// coding-standard: maintained
/**
 * Purchases-specific adapter for the shared RefundAllocationCard.
 * Maps purchase-domain props (orderDueAmount, orderNumber) to the generic shared component.
 */
import { useTranslations } from 'next-intl';
import { RefundAllocationCard as SharedRefundAllocationCard } from '@/components/shared/returns/refund-allocation-card';
import type { AccountPaymentOption } from '@/types';
import type { DueAllocation } from './types';

interface RefundAllocationCardProps {
  formatCurrency: (n: number) => string;
  totalRefundAmount: number;
  orderDueAmount: number;
  adjustOrderDueAmount: number;
  hasPendingDues: boolean;
  dueAllocations: DueAllocation[];
  onDueToggle: (index: number, selected: boolean) => void;
  onDueAmountChange: (index: number, amount: number) => void;
  remainingForRefund: number;
  accounts: AccountPaymentOption[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  accountRefundAmount: number;
  onAccountRefundChange: (amount: number) => void;
  totalOtherDuesAllocated: number;
  supplierCreditAmount?: number;
  onSupplierCreditChange?: (amount: number) => void;
}

export function RefundAllocationCard({
  orderDueAmount,
  adjustOrderDueAmount,
  dueAllocations,
  supplierCreditAmount,
  onSupplierCreditChange,
  ...rest
}: RefundAllocationCardProps) {
  const t = useTranslations('purchases.returns');
  return (
    <SharedRefundAllocationCard
      {...rest}
      documentDueAmount={orderDueAmount}
      adjustDocumentDueAmount={adjustOrderDueAmount}
      documentDueTitle={t('adjustThisOrderDue')}
      documentDueSubtitle={t('currentDueOnOrder')}
      otherDuesTitle={t('adjustOtherDuesSupplier')}
      adjustmentColorClass="text-blue-600"
      descriptionSuffix={t('fromSupplierSuffix')}
      dueAllocations={dueAllocations.map((d) => ({
        dueId: d.dueId,
        dueAmount: d.dueAmount,
        allocatedAmount: d.allocatedAmount,
        selected: d.selected,
        referenceLabel: d.orderNumber,
      }))}
      showCounterpartyCredit={true}
      counterpartyCreditAmount={supplierCreditAmount ?? 0}
      onCounterpartyCreditChange={onSupplierCreditChange}
      creditSectionTitle={t('convertToSupplierCredit')}
      creditSectionDescription={t('supplierCreditDesc')}
      creditSummaryLabel={t('supplierCreditSummaryLabel')}
    />
  );
}

