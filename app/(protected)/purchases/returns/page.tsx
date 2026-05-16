"use client";

import { Suspense, useEffect, useRef } from "react";
import {
  CornerUpLeft,
  FileText,
  Package,
  Plus,
  Search,
} from "lucide-react";

import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Textarea } from "@/ui/components/textarea";
import { BaseDataTable } from "@/ui/components/dataTable/base-data-table ";

import {
  usePurchaseReturnsPage,
  SummaryCards,
  ReturnItemRow,
  RefundAllocationCard,
  ReturnDetailsSheet,
  RETURN_REASONS,
} from "@/components/purchases/returns";
import type { PurchaseReturnReason } from "@/types";

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
    (order as unknown as { supplier?: { name?: string } } | undefined)?.supplier
      ?.name ||
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Find Purchase Order
          </CardTitle>
          <CardDescription>
            Enter an order ID or order number to process a return
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={ctx.searchForm.handleSubmit(ctx.handleSearch)}
            className="flex gap-4"
          >
            <div className="flex-1">
              <Input
                placeholder="Enter order ID or order number..."
                {...ctx.searchForm.register("orderId")}
              />
            </div>
            <Button
              type="submit"
              disabled={ctx.isLoadingOrder || !ctx.searchForm.watch("orderId")}
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {ctx.selectedOrderId && (
              <Button
                type="button"
                variant="outline"
                onClick={ctx.handleClearSearch}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Order Details & Return Form */}
      {ctx.order && (
        <>
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Order: {ctx.order.orderNumber}
              </CardTitle>
              <CardDescription>
                Supplier: {supplierName}
                {" \u2022 "}Total: {ctx.formatCurrency(ctx.order.invoiceAmount ?? 0)}
                {" \u2022 "}Paid: {ctx.formatCurrency(ctx.order.paidAmount ?? 0)}
                {(ctx.order.dueAmount ?? 0) > 0 && (
                  <span className="text-destructive">
                    {" \u2022 "}Due: {ctx.formatCurrency(ctx.order.dueAmount ?? 0)}
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
                Choose which items to return to the supplier and specify
                quantities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ctx.returnableItems.map((item, index) => (
                  <ReturnItemRow
                    key={item.inventoryId ?? item.productId ?? index}
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
                      {ctx.totalReturnQty} items &bull;{" "}
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
                    onValueChange={(v) =>
                      ctx.setReason(v as PurchaseReturnReason)
                    }
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
              {ctx.isSubmitting ? "Processing..." : "Process Return"}
            </Button>
          </div>
        </>
      )}

      {/* ─── Returns History Table ─── */}
      <Card>
        <CardHeader>
          <CardTitle>Returns</CardTitle>
          <CardDescription>
            {ctx.paginationInfo
              ? `${ctx.paginationInfo.total} return(s) found`
              : "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BaseDataTable
            columns={ctx.returnsColumns}
            data={ctx.returns}
            isLoading={ctx.isLoadingReturns}
            filterConfig={ctx.filterConfig}
            searchConfig={{
              globalSearch: true,
              placeholder: "Search returns...",
            }}
            actions={{}}
            pagination={{
              pageIndex: ctx.page - 1,
              pageSize: ctx.limit,
              totalPages: ctx.paginationInfo?.totalPages ?? 1,
              totalItems: ctx.paginationInfo?.total ?? 0,
              hasNext: ctx.paginationInfo?.hasNext ?? false,
              hasPrev: ctx.paginationInfo?.hasPrev ?? false,
              manualPagination: true,
              pageSizeOptions: [10, 20, 50, 100],
              onPaginationChange: ({ pageIndex, pageSize }) => {
                ctx.setPage(pageIndex + 1);
                if (pageSize !== ctx.limit) ctx.setLimit(pageSize);
              },
            }}
            enableSorting
          />
        </CardContent>
      </Card>

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
