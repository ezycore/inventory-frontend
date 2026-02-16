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
import { Separator } from "@/ui/components/separator";
import { Badge } from "@/ui/components/badge";
import { Skeleton } from "@/ui/components/skeleton";
import { ScrollArea } from "@/ui/components/scroll-area";
import { Button } from "@/ui/components/button";
import {
  FileText,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Wallet,
  Undo2,
  RefreshCw,
} from "lucide-react";
import { useCustomerLedger } from "@/services/api";
import { useCurrency } from "@/lib/currency";
import type { Customer, CustomerLedgerSale, CustomerLedgerPayment, CustomerLedgerReturn } from "@/types";
import { cn } from "@/ui/lib/utils";

interface CustomerLedgerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  isAccountsEnabled: boolean;
}

// Status configuration for badges
const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  partial: { label: "Partial", variant: "outline" },
  paid: { label: "Paid", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export function CustomerLedgerSheet({
  open,
  onOpenChange,
  customer,
  isAccountsEnabled,
}: CustomerLedgerSheetProps) {
  const { format: formatCurrency } = useCurrency();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: ledgerData, isLoading } = useCustomerLedger(
    customer?._id ?? null,
    { page, limit }
  );

  const ledger = ledgerData?.data;
  const sales = ledger?.sales || [];
  const payments = ledger?.payments || [];
  const returns = ledger?.returns || [];

  // Calculate summary from ledger data
  const totalPurchase = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalPaid = sales.reduce((sum, sale) => sum + sale.paidAmount, 0);
  const totalDue = sales.reduce((sum, sale) => sum + sale.dueAmount, 0);

  // Combine sales, payments, and returns into a unified ledger view
  type LedgerEntry = 
    | { type: "sale"; data: CustomerLedgerSale; date: Date }
    | { type: "payment"; data: CustomerLedgerPayment; date: Date }
    | { type: "return"; data: CustomerLedgerReturn; date: Date };

  const ledgerEntries: LedgerEntry[] = [
    ...sales.map((sale) => ({
      type: "sale" as const,
      data: sale,
      date: new Date(sale.createdAt),
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
            Customer Ledger - {customer?.name}
          </SheetTitle>
          <SheetDescription>
            Transaction history and account summary
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Summary Cards */}
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="grid grid-cols-3 gap-4">
              {/* <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Purchase</p>
                <p className="text-lg font-semibold">
                  {isLoading ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    formatCurrency(totalPurchase)
                  )}
                </p>
              </div> */}
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
                    key={`${entry.type}-${entry.type === "sale" ? entry.data._id : entry.type === "return" ? entry.data._id : entry.data._id}-${index}`}
                    className="rounded-lg border p-4 space-y-2"
                  >
                    {entry.type === "sale" ? (
                      // Sale entry
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {entry.data.invoiceNumber}
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
                              {formatCurrency(entry.data.totalAmount)}
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
                            <span className="text-muted-foreground">Original Sale:</span>{" "}
                            <span>{entry.data.invoiceNumber}</span>
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
                              <span className="font-medium text-red-600">
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
                    ) : entry.data.type === "salesRefund" ? (
                      // Cash Refund (Payment with type salesRefund)
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-600">
                              Cash Refund Issued
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
                              <span className="text-muted-foreground">Invoice:</span>{" "}
                              <span>{entry.data.referenceId.invoiceNumber}</span>
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
                      // Regular payment entry
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-600">
                              Payment Received
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
                              <span className="text-muted-foreground">Invoice:</span>{" "}
                              <span>{entry.data.referenceId.invoiceNumber}</span>
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
