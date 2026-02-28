'use client';

import { useEffect, useRef } from 'react';
import { CornerUpLeft, Search, Package, FileText } from 'lucide-react';

import { Button } from '@/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import { Textarea } from '@/ui/components/textarea';
import { CardTable } from '@/ui/components/custom/card-table';
import type { SalesReturnReason } from '@/types';

import {
  useSalesReturnPage,
  SummaryCards,
  ReturnItemRow,
  RefundAllocationCard,
  RETURN_REASONS,
} from '@/components/sales/returns';

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
      <div>
        <h1 className="text-3xl font-bold">Sales Returns</h1>
        <p className="text-muted-foreground">
          Process customer returns and manage refunds
        </p>
      </div>

      {/* Summary Stats */}
      <SummaryCards
        summary={ctx.summary}
        isLoading={ctx.isSummaryLoading}
        isAccountsEnabled={ctx.isAccountsEnabled}
        formatCurrency={ctx.formatCurrency}
      />

      {/* Search Sale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find Sale
          </CardTitle>
          <CardDescription>
            Enter a sale ID or invoice number to process a return
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={ctx.searchForm.handleSubmit(ctx.handleSearch)}
            className="flex gap-4"
          >
            <div className="flex-1">
              <Input
                placeholder="Enter sale ID or invoice number..."
                {...ctx.searchForm.register('saleId')}
              />
            </div>
            <Button type="submit" disabled={ctx.isLoadingSale}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {ctx.selectedSaleId && (
              <Button type="button" variant="outline" onClick={ctx.handleClearSearch}>
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Sale Details & Return Form */}
      {ctx.sale && (
        <>
          {/* Sale Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Sale: {ctx.sale.invoiceNumber}
              </CardTitle>
              <CardDescription>
                {ctx.sale.customerId?.name
                  ? `Customer: ${ctx.sale.customerId.name}`
                  : 'Walk-in Customer'}
                {' • '}Total: {ctx.formatCurrency(ctx.sale.totalAmount)}
                {' • '}Paid: {ctx.formatCurrency(ctx.sale.paidAmount)}
                {ctx.sale.dueAmount > 0 && (
                  <span className="text-destructive">
                    {' '}• Due: {ctx.formatCurrency(ctx.sale.dueAmount)}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Items Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Select Items to Return
              </CardTitle>
              <CardDescription>
                Choose which items the customer is returning and specify quantities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ctx.returnableItems.map((item, index) => (
                  <ReturnItemRow
                    key={item.inventoryId ?? item.productId}
                    item={item}
                    index={index}
                    formatCurrency={ctx.formatCurrency}
                    onSelect={ctx.handleItemSelect}
                    onQtyChange={ctx.handleItemQtyChange}
                    onRefundChange={ctx.handleRefundAmountChange}
                  />
                ))}
              </div>

              {ctx.totalReturnQty > 0 && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between text-lg font-medium">
                    <span>Total Return:</span>
                    <span>
                      {ctx.totalReturnQty} items •{' '}
                      {ctx.formatCurrency(ctx.totalRefundAmount)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Return Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CornerUpLeft className="h-5 w-5 text-primary" />
                Return Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reason for Return</Label>
                  <Select
                    value={ctx.reason}
                    onValueChange={(v) => ctx.setReason(v as SalesReturnReason)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RETURN_REASONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Additional notes about the return..."
                  value={ctx.notes}
                  onChange={(e) => ctx.setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

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
            />
          )}

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={ctx.handleClearSearch}>
              Cancel
            </Button>
            <Button
              onClick={ctx.handleSubmitReturn}
              disabled={ctx.totalReturnQty === 0 || ctx.isSubmitting}
            >
              <CornerUpLeft className="h-4 w-4 mr-2" />
              {ctx.isSubmitting ? 'Processing...' : 'Process Return'}
            </Button>
          </div>
        </>
      )}

      {/* Returns History */}
      <CardTable
        title="Recent Returns"
        description="View and manage processed sales returns"
        columns={ctx.returnsColumns}
        data={ctx.returns}
        emptyMessage="No sales returns found"
        isLoading={ctx.isLoadingReturns}
      />
    </div>
  );
}