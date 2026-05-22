'use client';

import { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/ui/components/button';
import type { SalesReturnReason } from '@/types';

import {
  useSalesReturnPage,
  SummaryCards,
  RefundAllocationCard,
  ReturnDetailsSheet,
  RETURN_REASONS,
} from '@/components/sales/returns';
import {
  ReturnSearchCard,
  ReturnDocumentSummaryCard,
  ReturnItemsCard,
  ReturnDetailsFormCard,
  ReturnSubmitActions,
  ReturnHistoryTable,
} from '@/components/shared/returns';

export default function SalesReturnsPage() {
  const ctx = useSalesReturnPage();
  const {
    sale,
    pendingDues,
    initFromSale,
    initFromPendingDues,
  } = ctx;

  const prevSaleRef = useRef(sale);
  const prevDuesRef = useRef(pendingDues);

  // Sync returnable items when sale data arrives / changes
  useEffect(() => {
    if (sale && sale !== prevSaleRef.current) {
      initFromSale(sale);
    }
    prevSaleRef.current = sale;
  }, [sale, initFromSale]);

  // Sync due allocations when pending-dues data arrives / changes
  useEffect(() => {
    if (pendingDues !== prevDuesRef.current && pendingDues.length > 0) {
      initFromPendingDues(pendingDues);
    }
    prevDuesRef.current = pendingDues;
  }, [pendingDues, initFromPendingDues]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales Returns</h1>
          <p className="text-muted-foreground">
            Manage product returns and refunds
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <SummaryCards
        summary={ctx.summary}
        isLoading={ctx.isSummaryLoading}
        isAccountsEnabled={ctx.isAccountsEnabled}
        formatCurrency={ctx.formatCurrency}
      />

      {/* Search Sale */}
      <ReturnSearchCard
        title="Find Sale"
        description="Enter a sale ID or invoice number to process a return"
        placeholder="Enter sale ID or invoice number..."
        inputProps={ctx.searchForm.register('saleId')}
        isLoading={ctx.isLoadingSale}
        hasValue={!!ctx.searchForm.watch('saleId')}
        selectedId={ctx.selectedSaleId}
        onFormSubmit={ctx.searchForm.handleSubmit(ctx.handleSearch)}
        onClear={ctx.handleClearSearch}
      />

      {/* Sale Details & Return Form */}
      {ctx.sale && (
        <>
          {/* Sale Summary */}
          <ReturnDocumentSummaryCard
            documentLabel="Sale"
            documentNumber={ctx.sale.invoiceNumber}
            counterpartyLabel="Customer"
            counterpartyName={ctx.sale.customerId?.name ?? 'Walk-in Customer'}
            subtotal={ctx.sale.subtotal}
            additionalDiscount={ctx.sale.additionalDiscount}
            totalAmount={ctx.sale.totalAmount}
            paidAmount={ctx.sale.paidAmount}
            dueAmount={ctx.sale.dueAmount}
            formatCurrency={ctx.formatCurrency}
          />

          {/* Items Selection */}
          <ReturnItemsCard
            description="Choose which items the customer is returning and specify quantities"
            items={ctx.returnableItems}
            totalReturnQty={ctx.totalReturnQty}
            totalRefundAmount={ctx.totalRefundAmount}
            formatCurrency={ctx.formatCurrency}
            onSelect={ctx.handleItemSelect}
            onQtyChange={ctx.handleItemQtyChange}
            onRefundChange={ctx.handleRefundAmountChange}
            getItemKey={(item) =>
              (item as { inventoryId?: string }).inventoryId ??
              (item as { productId?: string }).productId ??
              ''
            }
          />

          {/* Return Details */}
          <ReturnDetailsFormCard
            reasons={RETURN_REASONS}
            reason={ctx.reason}
            onReasonChange={(v) => ctx.setReason(v as SalesReturnReason)}
            notes={ctx.notes}
            onNotesChange={ctx.setNotes}
            deductionAmount={ctx.deductionAmount}
            onDeductionChange={ctx.setDeductionAmount}
            grossRefundAmount={ctx.grossRefundAmount}
            formatCurrency={ctx.formatCurrency}
          />

          {/* Refund Allocation (accounts feature) */}
          {ctx.isAccountsEnabled && ctx.totalRefundAmount > 0 && (
            <RefundAllocationCard
              formatCurrency={ctx.formatCurrency}
              totalRefundAmount={ctx.totalRefundAmount}
              saleDueAmount={ctx.saleDueAmount}
              adjustSaleDueAmount={ctx.adjustSaleDueAmount}
              hasPendingDues={ctx.pendingDues.length > 0}
              dueAllocations={ctx.dueAllocations}
              onDueToggle={ctx.handleDueAllocationToggle}
              onDueAmountChange={ctx.handleDueAllocationAmountChange}
              remainingForRefund={ctx.remainingForRefund}
              accounts={ctx.accounts}
              selectedAccountId={ctx.selectedAccountId}
              onAccountChange={ctx.setSelectedAccountId}
              accountRefundAmount={ctx.accountRefundAmount}
              onAccountRefundChange={ctx.setAccountRefundAmount}
              totalOtherDuesAllocated={ctx.totalOtherDuesAllocated}
              customerCreditAmount={ctx.customerCreditAmount}
              onCustomerCreditChange={ctx.setCustomerCreditAmount}
              currentCustomerCreditBalance={ctx.sale?.customerId?.creditBalance}
            />
          )}

          {/* Submit */}
          <ReturnSubmitActions
            onCancel={ctx.handleClearSearch}
            onSubmit={ctx.handleSubmitReturn}
            isSubmitting={ctx.isSubmitting}
            disabled={ctx.totalReturnQty === 0}
          />
        </>
      )}

      {/* Returns History Table */}
      <ReturnHistoryTable
        columns={ctx.returnsColumns}
        data={ctx.returns}
        isLoading={ctx.isLoadingReturns}
        filterConfig={ctx.filterConfig}
        paginationInfo={ctx.paginationInfo}
        page={ctx.page}
        limit={ctx.limit}
        setPage={ctx.setPage}
        setLimit={ctx.setLimit}
      />

      {/* Return Details Sheet */}
      <ReturnDetailsSheet
        open={ctx.detailsSheetOpen}
        onOpenChange={ctx.setDetailsSheetOpen}
        salesReturn={ctx.selectedReturn}
        formatCurrency={ctx.formatCurrency}
      />
    </div>
  );
}