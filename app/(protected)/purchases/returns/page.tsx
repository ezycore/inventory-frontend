"use client";

import { Suspense } from "react";
import {
  CornerUpLeft,
  FileText,
  Package,
  Search,
  Truck,
} from "lucide-react";

import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Checkbox } from "@/ui/components/checkbox";
import { CardTable } from "@/ui/components/custom/card-table";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Separator } from "@/ui/components/separator";
import { Skeleton } from "@/ui/components/skeleton";
import { Textarea } from "@/ui/components/textarea";

import {
  usePurchaseReturnsPage,
  SummaryCards,
  RETURN_REASONS,
} from "@/components/purchases/returns";
import type { PurchaseReturnReason } from "@/types";

function PurchaseReturnsPageContent() {
  const h = usePurchaseReturnsPage();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Purchase Returns</h1>
        <p className="text-muted-foreground">
          Return items to suppliers and manage refunds
        </p>
      </div>

      {/* Summary Stats */}
      <SummaryCards
        isSummaryLoading={h.isSummaryLoading}
        summary={h.summary}
        formatCurrency={h.formatCurrency}
      />

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Find Purchase Order
          </CardTitle>
          <CardDescription>
            Search by order ID or order number to initiate a return
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={h.searchForm.handleSubmit(h.handleSearch)}
            className="flex gap-4"
          >
            <div className="flex-1">
              <Input
                {...h.searchForm.register("orderId")}
                placeholder="Enter order ID or order number..."
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={h.isLoadingOrder}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            {h.selectedOrderId && (
              <Button
                type="button"
                variant="outline"
                onClick={h.handleClearSearch}
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Order Details & Return Form */}
      {h.selectedOrderId && (
        <>
          {h.isLoadingOrder ? (
            <Card>
              <CardContent className="py-8">
                <div className="space-y-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : h.order ? (
            <>
              {/* Order Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order: {h.order.orderNumber}
                  </CardTitle>
                  <CardDescription>
                    <span className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Supplier: {h.order.supplierId?.name || "Unknown"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-2 font-medium">
                        {h.formatCurrency(
                          h.order.grandTotal || h.order.totalAmount || 0,
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Paid:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {h.formatCurrency(h.order.paidAmount || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due:</span>
                      <span
                        className={`ml-2 font-medium ${(h.order.dueAmount || 0) > 0 ? "text-red-600" : ""}`}
                      >
                        {h.formatCurrency(h.order.dueAmount || 0)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className="ml-2">
                        {h.order.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Items to Return</CardTitle>
                  <CardDescription>
                    Choose items and enter return quantities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CardTable
                    columns={h.itemsColumns}
                    data={h.returnableItems}
                  />
                </CardContent>
              </Card>

              {/* Return Details */}
              {h.totalReturnQty > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Return Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Reason & Notes */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Reason for Return</Label>
                        <Select
                          value={h.reason}
                          onValueChange={(v) =>
                            h.setReason(v as PurchaseReturnReason)
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
                      <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Textarea
                          value={h.notes}
                          onChange={(e) => h.setNotes(e.target.value)}
                          placeholder="Additional notes..."
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Refund Allocation (if accounts enabled) */}
                    {h.isAccountsEnabled && h.totalRefundAmount > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="font-medium mb-4">
                            Refund Allocation
                          </h4>

                          {/* Adjust current order due */}
                          {h.orderDueAmount > 0 && (
                            <div className="rounded-lg border p-4 mb-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">
                                    Adjust This Order&apos;s Due
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Current due:{" "}
                                    {h.formatCurrency(h.orderDueAmount)}
                                  </p>
                                </div>
                                <span className="font-medium text-blue-600">
                                  -{h.formatCurrency(h.adjustOrderDueAmount)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Adjust other dues */}
                          {h.dueAllocations.length > 0 && (
                            <div className="space-y-2 mb-4">
                              <p className="text-sm font-medium">
                                Adjust Other Dues to This Supplier
                              </p>
                              {h.dueAllocations.map((due, index) => (
                                <div
                                  key={due.dueId}
                                  className="flex items-center gap-4 p-3 rounded-lg border"
                                >
                                  <Checkbox
                                    checked={due.selected}
                                    onCheckedChange={(checked) =>
                                      h.handleDueAllocationToggle(
                                        index,
                                        checked as boolean,
                                      )
                                    }
                                  />
                                  <div className="flex-1">
                                    <span className="font-mono text-sm">
                                      {due.orderNumber}
                                    </span>
                                    <span className="text-muted-foreground text-sm ml-2">
                                      (Due:{" "}
                                      {h.formatCurrency(due.dueAmount)})
                                    </span>
                                  </div>
                                  <Input
                                    type="number"
                                    className="w-28 text-right"
                                    value={due.allocatedAmount}
                                    onChange={(e) =>
                                      h.handleDueAllocationAmountChange(
                                        index,
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    disabled={!due.selected}
                                    min={0}
                                    max={due.dueAmount}
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Cash refund to account */}
                          {h.remainingForRefund > 0 && (
                            <div className="rounded-lg border p-4">
                              <p className="text-sm font-medium mb-3">
                                Cash Refund to Account
                              </p>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Account</Label>
                                  <Select
                                    value={h.selectedAccountId}
                                    onValueChange={h.setSelectedAccountId}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {h.accounts.map((acc: any) => (
                                        <SelectItem
                                          key={acc._id}
                                          value={acc._id}
                                        >
                                          {acc.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>
                                    Amount (Max:{" "}
                                    {h.formatCurrency(h.remainingForRefund)})
                                  </Label>
                                  <Input
                                    type="number"
                                    value={h.accountRefundAmount}
                                    onChange={(e) =>
                                      h.setAccountRefundAmount(
                                        Math.min(
                                          parseFloat(e.target.value) || 0,
                                          h.remainingForRefund,
                                        ),
                                      )
                                    }
                                    min={0}
                                    max={h.remainingForRefund}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Summary & Submit */}
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Returning {h.totalReturnQty} item(s)
                        </p>
                        <p className="text-lg font-semibold">
                          Total Refund:{" "}
                          {h.formatCurrency(h.totalRefundAmount)}
                        </p>
                      </div>
                      <Button
                        size="lg"
                        onClick={h.handleSubmitReturn}
                        disabled={
                          h.createReturnMutation.isPending ||
                          h.totalReturnQty === 0
                        }
                      >
                        {h.createReturnMutation.isPending ? (
                          "Processing..."
                        ) : (
                          <>
                            <CornerUpLeft className="h-4 w-4 mr-2" />
                            Submit Return
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Order not found</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Recent Returns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Returns
          </CardTitle>
          <CardDescription>History of purchase returns</CardDescription>
        </CardHeader>
        <CardContent>
          {h.isLoadingReturns ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : h.returns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CornerUpLeft className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No returns recorded yet</p>
            </div>
          ) : (
            <CardTable columns={h.returnsColumns} data={h.returns} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Wrap in Suspense boundary to handle useSearchParams
export default function PurchaseReturnsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 p-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <PurchaseReturnsPageContent />
    </Suspense>
  );
}
