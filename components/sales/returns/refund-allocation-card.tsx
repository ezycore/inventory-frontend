/**
 * Sales-specific adapter for the shared RefundAllocationCard.
 * Maps sale-domain props (saleDueAmount, invoiceNumber) to the generic shared component.
 */
import { RefundAllocationCard as SharedRefundAllocationCard } from '@/components/shared/returns/refund-allocation-card';
import type { Account } from '@/types';
import type { DueAllocation } from './types';

interface RefundAllocationCardProps {
  formatCurrency: (n: number) => string;
  totalRefundAmount: number;
  saleDueAmount: number;
  adjustSaleDueAmount: number;
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
  customerCreditAmount?: number;
  onCustomerCreditChange?: (amount: number) => void;
  currentCustomerCreditBalance?: number;
}

export function RefundAllocationCard({
  saleDueAmount,
  adjustSaleDueAmount,
  dueAllocations,
  customerCreditAmount,
  onCustomerCreditChange,
  currentCustomerCreditBalance,
  ...rest
}: RefundAllocationCardProps) {
  return (
    <SharedRefundAllocationCard
      {...rest}
      documentDueAmount={saleDueAmount}
      adjustDocumentDueAmount={adjustSaleDueAmount}
      documentDueTitle="Adjust Current Sale Due"
      documentDueSubtitle="Current due on this sale:"
      otherDuesTitle="Adjust Other Customer Dues"
      adjustmentColorClass="text-green-600"
      showCounterpartyCredit={!!onCustomerCreditChange}
      counterpartyCreditAmount={customerCreditAmount}
      onCounterpartyCreditChange={onCustomerCreditChange}
      currentCounterpartyCreditBalance={currentCustomerCreditBalance}
      dueAllocations={dueAllocations.map((d) => ({
        dueId: d.dueId,
        dueAmount: d.dueAmount,
        allocatedAmount: d.allocatedAmount,
        selected: d.selected,
        referenceLabel: `Invoice: ${d.invoiceNumber}`,
      }))}
    />
  );
}

