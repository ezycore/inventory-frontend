'use client';

import { useCallback, useMemo, useState } from 'react';
import type { DueAllocation, PendingDueRaw } from './types';

function buildDueAllocations(dues: PendingDueRaw[]): DueAllocation[] {
  return dues.map((due) => {
    const extractedSaleId =
      typeof due.saleId === 'object' && due.saleId?._id
        ? due.saleId._id
        : String(due.saleId);
    const extractedInvoice =
      typeof due.saleId === 'object' && due.saleId?.invoiceNumber
        ? due.saleId.invoiceNumber
        : (due.invoiceNumber ?? '');
    return {
      dueId: due.id ?? due._id ?? '',
      saleId: extractedSaleId,
      invoiceNumber: extractedInvoice,
      dueAmount: due.currentAmount,
      allocatedAmount: 0,
      selected: false,
    };
  });
}

export function useRefundAllocation(params: {
  totalRefundAmount: number;
  saleDueAmount: number;
}) {
  const { totalRefundAmount, saleDueAmount } = params;

  const [deductionAmount, setDeductionAmount] = useState(0);
  const [dueAllocations, setDueAllocations] = useState<DueAllocation[]>([]);
  const [accountRefundAmount, setAccountRefundAmount] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [customerCreditAmount, setCustomerCreditAmount] = useState(0);

  const resetAllocation = useCallback(() => {
    setDeductionAmount(0);
    setDueAllocations([]);
    setAccountRefundAmount(0);
    setSelectedAccountId('');
    setCustomerCreditAmount(0);
  }, []);

  const initFromPendingDues = useCallback((dues: PendingDueRaw[]) => {
    if (dues.length) setDueAllocations(buildDueAllocations(dues));
  }, []);

  const handleDueAllocationToggle = useCallback((index: number, selected: boolean) => {
    setDueAllocations((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        selected,
        allocatedAmount: selected ? updated[index].dueAmount : 0,
      };
      return updated;
    });
  }, []);

  const handleDueAllocationAmountChange = useCallback(
    (index: number, amount: number) => {
      setDueAllocations((prev) => {
        const updated = [...prev];
        const due = updated[index];
        updated[index] = {
          ...due,
          allocatedAmount: Math.max(0, Math.min(amount, due.dueAmount)),
        };
        return updated;
      });
    },
    [],
  );

  const adjustSaleDueAmount = useMemo(
    () => Math.min(totalRefundAmount, saleDueAmount),
    [totalRefundAmount, saleDueAmount],
  );
  const totalOtherDuesAllocated = useMemo(
    () =>
      dueAllocations
        .filter((d) => d.selected)
        .reduce((sum, d) => sum + d.allocatedAmount, 0),
    [dueAllocations],
  );
  const remainingForRefund = useMemo(() => {
    const afterSaleDue = totalRefundAmount - adjustSaleDueAmount;
    return Math.max(
      0,
      afterSaleDue - totalOtherDuesAllocated - customerCreditAmount,
    );
  }, [
    totalRefundAmount,
    adjustSaleDueAmount,
    totalOtherDuesAllocated,
    customerCreditAmount,
  ]);

  return {
    // state
    deductionAmount,
    setDeductionAmount,
    dueAllocations,
    accountRefundAmount,
    setAccountRefundAmount,
    selectedAccountId,
    setSelectedAccountId,
    customerCreditAmount,
    setCustomerCreditAmount,
    // derived
    adjustSaleDueAmount,
    totalOtherDuesAllocated,
    remainingForRefund,
    // actions
    resetAllocation,
    initFromPendingDues,
    handleDueAllocationToggle,
    handleDueAllocationAmountChange,
  };
}
