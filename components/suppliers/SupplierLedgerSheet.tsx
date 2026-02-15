"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { Badge } from "@/ui/components/badge";
import { Skeleton } from "@/ui/components/skeleton";
import { ScrollArea } from "@/ui/components/scroll-area";
import { Button } from "@/ui/components/button";
import {
  FileText,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Package,
  Wallet,
  RefreshCw,
} from "lucide-react";
import { useSupplierLedger } from "@/services/api";
import { useCurrency } from "@/lib/currency";
import type { Supplier, SupplierLedgerPurchaseOrder, SupplierLedgerPayment, SupplierLedgerReturn } from "@/types";
import { cn } from "@/ui/lib/utils";

interface SupplierLedgerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  isAccountsEnabled: boolean;
}

// Status configuration for badges
const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  ordered: { label: "Ordered", variant: "outline" },
  partial: { label: "Partial", variant: "outline" },
  received: { label: "Received", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export function SupplierLedgerSheet({
  open,
  onOpenChange,
  supplier,
  isAccountsEnabled,
}: SupplierLedgerSheetProps) {
  const { format: formatCurrency } = useCurrency();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: ledgerData, isLoading } = useSupplierLedger(
    supplier?._id ?? null,
    { page, limit }
  );

  const ledger = ledgerData?.data;
  const purchaseOrders = ledger?.purchaseOrders || [];
  const payments = ledger?.payments || [];
  const returns = ledger?.returns || [];

  // Calculate summary from ledger data
  const totalPurchase = purchaseOrders.reduce((sum, po) => sum + po.invoiceAmount, 0);
  const totalPaid = purchaseOrders.reduce((sum, po) => sum + po.paidAmount, 0);
  const totalDue = purchaseOrders.reduce((sum, po) => sum + po.dueAmount, 0);

  // Combine purchase orders, payments, and returns into a unified ledger view
  type LedgerEntry = 
    | { type: "purchaseOrder"; data: SupplierLedgerPurchaseOrder; date: Date }
    | { type: "payment"; data: SupplierLedgerPayment; date: Date }
    | { type: "return"; data: SupplierLedgerReturn; date: Date };

  const ledgerEntries: LedgerEntry[] = [
    ...purchaseOrders.map((po) => ({
      type: "purchaseOrder" as const,
      data: po,
      date: new Date(po.createdAt),
    })),
    ...payments.map((payment) => ({
      type: "payment" as const,
      data: payment,
      date: new Date(payment.createdAt),
    })),
    ...returns.map((returnItem) => ({
      type: "return" as const,
      data: returnItem,
      date: new Date(returnItem.createdAt),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[550px] sm:max-w-[550px] flex flex-col h-full p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Supplier Ledger - {supplier?.name}
          </SheetTitle>
          <SheetDescription>
            Transaction history and account summary
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Summary Cards */}
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="grid grid-cols-3 gap-4">
              {isAccountsEnabled && (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                    <p className="text-lg font-semibold text-green-600">
                      {isLoading ? (
                        <Skeleton className="h-6 w-20" />
                      ) : (
                        formatCurrency(totalPaid)
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Due</p>
                    <p
                      className={cn(
                        "text-lg font-semibold",
                        totalDue > 0 ? "text-red-600" : "text-green-600"
                      )}
                    >
                      {isLoading ? (
                        <Skeleton className="h-6 w-20" />
                      ) : (
                        formatCurrency(totalDue)
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Ledger Entries */}
          <ScrollArea className="flex-1 px-6 overflow-y-auto">
            <div className="py-4 space-y-3">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))
              ) : ledgerEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No transactions found</p>
                </div>
              ) : (
                ledgerEntries.map((entry, index) => (
                  <div
                    key={`${entry.type}-${entry.type === "purchaseOrder" ? entry.data._id : entry.type === "return" ? entry.data._id : entry.data._id}-${index}`}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    {entry.type === "purchaseOrder" ? (
                      // Purchase Order entry
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {entry.data.invoiceNumber || entry.data.orderNumber}
                            </span>
                            <Badge variant={statusConfig[entry.data.status]?.variant || "secondary"}>
                              {statusConfig[entry.data.status]?.label || entry.data.status}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(entry.date, "dd MMM yyyy")}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Amount:</span>{" "}
                            <span className="font-medium">
                              {formatCurrency(entry.data.invoiceAmount)}
                            </span>
                          </div>
                          {isAccountsEnabled && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Paid:</span>{" "}
                                <span className="font-medium text-green-600">
                                  {formatCurrency(entry.data.paidAmount)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Due:</span>{" "}
                                <span
                                  className={cn(
                                    "font-medium",
                                    entry.data.dueAmount > 0
                                      ? "text-red-600"
                                      : "text-green-600"
                                  )}
                                >
                                  {formatCurrency(entry.data.dueAmount)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    ) : entry.type === "return" ? (
                      // Return entry
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 text-orange-600" />
                            <span className="font-medium text-orange-600">
                              Return {entry.data.returnNumber}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(entry.date, "dd MMM yyyy")}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-muted-foreground">Original Order:</span>{" "}
                            <span>{entry.data.orderNumber}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Refund Amount:</span>{" "}
                            <span className="font-medium text-orange-600">
                              {formatCurrency(entry.data.totalRefundAmount)}
                            </span>
                          </div>
                          {isAccountsEnabled && entry.data.refundedAmount > 0 && (
                            <div>
                              <span className="text-muted-foreground">Cash Refunded:</span>{" "}
                              <span className="font-medium text-green-600">
                                {formatCurrency(entry.data.refundedAmount)}
                              </span>
                            </div>
                          )}
                          {isAccountsEnabled && entry.data.totalRefundAmount > entry.data.refundedAmount && (
                            <div>
                              <span className="text-muted-foreground">Due Adjusted:</span>{" "}
                              <span className="font-medium text-blue-600">
                                {formatCurrency(entry.data.totalRefundAmount - entry.data.refundedAmount)}
                              </span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : entry.data.type === "purchase_return" ? (
                      // Refund from supplier (purchase return)
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-600">
                              Refund Received
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(entry.date, "dd MMM yyyy")}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-muted-foreground">Amount:</span>{" "}
                            <span className="font-medium text-green-600">
                              {formatCurrency(entry.data.amount)}
                            </span>
                          </div>
                          {entry.data.referenceId && (
                            <div>
                              <span className="text-muted-foreground">Order:</span>{" "}
                              <span>{entry.data.referenceId.invoiceNumber || entry.data.referenceId.orderNumber}</span>
                            </div>
                          )}
                          {entry.data.accountId && (
                            <div>
                              <span className="text-muted-foreground">Account:</span>{" "}
                              <span>{entry.data.accountId.name}</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : entry.data.type === "purchase_cancelled" ? (
                      // Cancelled order refund
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-600">
                              Cancelled Order Refund
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(entry.date, "dd MMM yyyy")}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-muted-foreground">Amount:</span>{" "}
                            <span className="font-medium text-blue-600">
                              {formatCurrency(entry.data.amount)}
                            </span>
                          </div>
                          {entry.data.referenceId && (
                            <div>
                              <span className="text-muted-foreground">Order:</span>{" "}
                              <span>{entry.data.referenceId.invoiceNumber || entry.data.referenceId.orderNumber}</span>
                            </div>
                          )}
                          {entry.data.accountId && (
                            <div>
                              <span className="text-muted-foreground">Account:</span>{" "}
                              <span>{entry.data.accountId.name}</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      // Regular payment entry (payment to supplier)
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-600">
                              Payment Made
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {format(entry.date, "dd MMM yyyy")}
                          </span>
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-muted-foreground">Amount:</span>{" "}
                            <span className="font-medium text-red-600">
                              {formatCurrency(entry.data.amount)}
                            </span>
                          </div>
                          {entry.data.referenceId && (
                            <div>
                              <span className="text-muted-foreground">Order:</span>{" "}
                              <span>{entry.data.referenceId.invoiceNumber || entry.data.referenceId.orderNumber}</span>
                            </div>
                          )}
                          {entry.data.accountId && (
                            <div>
                              <span className="text-muted-foreground">Account:</span>{" "}
                              <span>{entry.data.accountId.name}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Pagination */}
          {ledger && ledger.totalPages > 1 && (
            <div className="px-6 py-3 border-t flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Page {page} of {ledger.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!ledger.hasPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!ledger.hasNext}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
