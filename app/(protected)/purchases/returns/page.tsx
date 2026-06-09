"use client";

import { Suspense, useEffect, useRef } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/ui/components/button";
import type { PurchaseReturnReason } from "@/types";

import {
  usePurchaseReturnsPage,
  SummaryCards,
  RefundAllocationCard,
  ReturnDetailsSheet,
  RETURN_REASONS,
} from "@/components/purchases/returns";
import {
  ReturnSearchCard,
  ReturnDocumentSummaryCard,
  ReturnItemsCard,
  ReturnDetailsFormCard,
  ReturnSubmitActions,
  ReturnHistoryTable,
} from "@/components/shared/returns";

function PurchaseReturnsPageContent() {
  const ctx = usePurchaseReturnsPage();
  const { order, pendingDues, initFromOrder, initFromPendingDues } = ctx;

  const prevOrderRef = useRef(order);
  const prevDuesRef = useRef(pendingDues);

  useEffect(() => {
    if (order && order !== prevOrderRef.current) initFromOrder(order);
    prevOrderRef.current = order;
  }, [order, initFromOrder]);

  useEffect(() => {
    if (pendingDues !== prevDuesRef.current && pendingDues.length > 0) {
      initFromPendingDues(pendingDues);
    }
    prevDuesRef.current = pendingDues;
  }, [pendingDues, initFromPendingDues]);

  const supplierName =
    (order?.supplierId as { name?: string } | undefined)?.name ||
    (order as unknown as { supplier?: { name?: string } } | undefined)
      ?.supplier?.name ||
    "Unknown Supplier";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Returns</h1>
          <p className="text-muted-foreground">
            Manage product returns and refunds
          </p>
        </div>
        <Button onClick={() => ctx.setShowNewReturn(!ctx.showNewReturn)}>
          <Plus className="h-4 w-4 mr-2" />
          New Return
        </Button>
      </div>

      {/* Summary Stats */}
      <SummaryCards
        isSummaryLoading={ctx.isSummaryLoading}
        summary={ctx.summary}
        formatCurrency={ctx.formatCurrency}
      />

      {/* Search Order */}
      <ReturnSearchCard
        title="Find Purchase Order"
        description="Enter an order ID or order number to process a return"
        placeholder="Enter order ID or order number..."
        inputProps={ctx.searchForm.register("orderId")}
        isLoading={ctx.isLoadingOrder}
        hasValue={!!ctx.searchForm.watch("orderId")}
        selectedId={ctx.selectedOrderId}
        onFormSubmit={ctx.searchForm.handleSubmit(ctx.handleSearch)}
        onClear={ctx.handleClearSearch}
      />

      {/* Order Details & Return Form */}
      {ctx.order && (
        <>
          {/* Order Summary */}
          <ReturnDocumentSummaryCard
            documentLabel="Order"
            documentNumber={ctx.order.orderNumber}
            counterpartyLabel="Supplier"
            counterpartyName={supplierName}
            subtotal={ctx.order.subtotal}
            additionalDiscount={ctx.order.additionalDiscount}
            taxTotal={ctx.order.taxTotal}
            totalAmount={ctx.order.invoiceAmount ?? 0}
            paidAmount={ctx.order.paidAmount ?? 0}
            dueAmount={ctx.order.dueAmount ?? 0}
            refundCreditApplied={ctx.order.refundCreditApplied ?? 0}
            formatCurrency={ctx.formatCurrency}
          />

          {/* Items Selection */}
          <ReturnItemsCard
            description="Choose which items to return to the supplier and specify quantities"
            items={ctx.returnableItems}
            totalReturnQty={ctx.totalReturnQty}
            totalRefundAmount={ctx.totalRefundAmount}
            formatCurrency={ctx.formatCurrency}
            onSelect={ctx.handleItemSelect}
            onQtyChange={ctx.handleItemQtyChange}
            onRefundChange={ctx.handleRefundAmountChange}
            getItemKey={(item, index) =>
              (item as { inventoryId?: string }).inventoryId ??
              (item as { productId?: string }).productId ??
              index
            }
          />

          {/* Return Details */}
          <ReturnDetailsFormCard
            reasons={RETURN_REASONS}
            reason={ctx.reason}
            onReasonChange={(v) => ctx.setReason(v as PurchaseReturnReason)}
            notes={ctx.notes}
            onNotesChange={ctx.setNotes}
            deductionAmount={ctx.deductionAmount}
            onDeductionChange={ctx.setDeductionAmount}
            grossRefundAmount={ctx.grossRefundAmount}
            formatCurrency={ctx.formatCurrency}
          />

          {/* Refund Allocation */}
          {ctx.isAccountsEnabled && ctx.totalRefundAmount > 0 && (
            <RefundAllocationCard
              formatCurrency={ctx.formatCurrency}
              totalRefundAmount={ctx.totalRefundAmount}
              orderDueAmount={ctx.orderDueAmount}
              adjustOrderDueAmount={ctx.adjustOrderDueAmount}
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
              supplierCreditAmount={ctx.supplierCreditAmount}
              onSupplierCreditChange={ctx.setSupplierCreditAmount}
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
        purchaseReturn={ctx.selectedReturn}
        formatCurrency={ctx.formatCurrency}
      />
    </div>
  );
}

export default function PurchaseReturnsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <PurchaseReturnsPageContent />
    </Suspense>
  );
}
