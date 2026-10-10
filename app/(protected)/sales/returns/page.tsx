'use client';
// coding-standard: maintained
import { useEffect, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';

import { Button } from '@/ui/components/button';
import type { SalesReturnReason } from '@/types';
import { populatedRef } from '@/utils/populated-ref';

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
import { ReturnSerialPicker } from '@/components/sales/serials/return-serial-picker';

const REASON_KEYS: Record<string, string> = {
  damaged: 'damaged',
  defective: 'defective',
  wrong_item: 'wrongItem',
  customer_changed_mind: 'customerChangedMind',
  expired: 'expired',
  refused_delivery: 'refusedDelivery',
  other: 'other',
};

export default function SalesReturnsPage() {
  const t = useTranslations('sales.returns');
  const returnReasons = useMemo(
    () =>
      RETURN_REASONS.map((r) => ({
        ...r,
        label: t(`reasons.${REASON_KEYS[r.value] ?? 'other'}`),
      })),
    [t],
  );
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
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
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
        title={t('findSale')}
        description={t('findSaleDescription')}
        placeholder={t('findSalePlaceholder')}
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
            documentLabel={t('saleLabel')}
            documentNumber={ctx.sale.invoiceNumber}
            counterpartyLabel={t('customerLabel')}
            counterpartyName={populatedRef(ctx.sale.customerId)?.name ?? t('walkInCustomer')}
            subtotal={ctx.sale.subtotal}
            additionalDiscount={ctx.sale.additionalDiscount}
            items={ctx.sale.items}
            totalAmount={ctx.sale.totalAmount}
            paidAmount={ctx.sale.paidAmount}
            dueAmount={ctx.sale.dueAmount}
            formatCurrency={ctx.formatCurrency}
          />

          {/* Items Selection */}
          <ReturnItemsCard
            description={t('itemsDescription')}
            items={ctx.returnableItems}
            totalReturnQty={ctx.totalReturnQty}
            totalRefundAmount={ctx.totalRefundAmount}
            formatCurrency={ctx.formatCurrency}
            onSelect={ctx.handleItemSelect}
            onQtyChange={ctx.handleItemQtyChange}
            onRefundChange={ctx.handleRefundAmountChange}
            renderItemExtra={(_item, index) => {
              const line = ctx.returnableItems[index];
              return (
                <ReturnSerialPicker
                  serials={line?.serials}
                  picked={line?.returnSerials ?? []}
                  onChange={(serials) => ctx.handleItemSerialsChange(index, serials)}
                />
              );
            }}
            getItemKey={(item) =>
              (item as { inventoryId?: string }).inventoryId ??
              (item as { productId?: string }).productId ??
              ''
            }
          />

          {/* Return Details */}
          <ReturnDetailsFormCard
            reasons={returnReasons}
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
              currentCustomerCreditBalance={populatedRef(ctx.sale?.customerId)?.creditBalance}
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
        key={ctx.listRevision}
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