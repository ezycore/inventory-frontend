/**
 * Purchases-specific adapter for the shared RefundAllocationCard.
 * Maps purchase-domain props (orderDueAmount, orderNumber) to the generic shared component.
 */
import { RefundAllocationCard as SharedRefundAllocationCard } from '@/components/shared/returns/refund-allocation-card';
import type { Account } from '@/types';
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
  accounts: Account[];
  selectedAccountId: string;
  onAccountChange: (id: string) => void;
  accountRefundAmount: number;
  onAccountRefundChange: (amount: number) => void;
  totalOtherDuesAllocated: number;
}

export function RefundAllocationCard({
  orderDueAmount,
  adjustOrderDueAmount,
  dueAllocations,
  ...rest
}: RefundAllocationCardProps) {
  return (
    <SharedRefundAllocationCard
      {...rest}
      documentDueAmount={orderDueAmount}
      adjustDocumentDueAmount={adjustOrderDueAmount}
      documentDueTitle="Adjust This Order's Due"
      documentDueSubtitle="Current due on this order:"
      otherDuesTitle="Adjust Other Dues to This Supplier"
      adjustmentColorClass="text-blue-600"
      descriptionSuffix=" from the supplier"
      dueAllocations={dueAllocations.map((d) => ({
        dueId: d.dueId,
        dueAmount: d.dueAmount,
        allocatedAmount: d.allocatedAmount,
        selected: d.selected,
        referenceLabel: d.orderNumber,
      }))}
    />
  );
}

