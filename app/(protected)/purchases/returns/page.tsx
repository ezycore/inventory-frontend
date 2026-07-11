"use client";
// coding-standard: maintained

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
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

const REASON_KEYS: Record<string, string> = {
  damaged: "reasonDamaged",
  defective: "reasonDefective",
  wrong_item: "reasonWrongItem",
  excess_quantity: "reasonExcessQuantity",
  expired: "reasonExpired",
  other: "reasonOther",
};

function PurchaseReturnsPageContent() {
  const t = useTranslations("purchases.returns");
  const returnReasons = useMemo(
    () =>
      RETURN_REASONS.map((r) => ({
        ...r,
        label: t(REASON_KEYS[r.value] ?? "reasonOther"),
      })),
    [t],
  );
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
    t("unknownSupplier");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Button onClick={() => ctx.setShowNewReturn(!ctx.showNewReturn)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("newReturn")}
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
        title={t("findOrder")}
        description={t("findOrderDesc")}
        placeholder={t("findOrderPlaceholder")}
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
            documentLabel={t("documentLabel")}
            documentNumber={ctx.order.orderNumber}
            counterpartyLabel={t("counterpartyLabel")}
            counterpartyName={supplierName}
            subtotal={ctx.order.subtotal}
            additionalDiscount={ctx.order.additionalDiscount}
            taxTotal={ctx.order.taxTotal}
            items={ctx.order.items}
            totalAmount={ctx.order.invoiceAmount ?? 0}
            paidAmount={ctx.order.paidAmount ?? 0}
            dueAmount={ctx.order.dueAmount ?? 0}
            refundCreditApplied={ctx.order.refundCreditApplied ?? 0}
            formatCurrency={ctx.formatCurrency}
          />

          {/* Items Selection */}
          <ReturnItemsCard
            description={t("itemsDesc")}
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
            reasons={returnReasons}
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

function ReturnsFallback() {
  const t = useTranslations("common.empty");
  return <div className="p-6">{t("loading")}</div>;
}

export default function PurchaseReturnsPage() {
  return (
    <Suspense fallback={<ReturnsFallback />}>
      <PurchaseReturnsPageContent />
    </Suspense>
  );
}
