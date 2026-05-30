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
import { Switch } from "@/ui/components/switch";
import {
  FileText,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Package,
  Wallet,
  RefreshCw,
  ArrowLeft,
  Undo2,
} from "lucide-react";
import {
  useSupplierLedger,
  useAddPurchasePayment,
  useAccounts,
} from "@/services/api";
import { useCurrency } from "@/lib/currency";
import type {
  Supplier,
  SupplierLedgerPurchaseOrder,
  SupplierLedgerPayment,
  SupplierLedgerReturn,
  SupplierLedgerInboundCredit,
} from "@/types";
import { cn } from "@/ui/lib/utils";

interface SupplierLedgerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  isAccountsEnabled: boolean;
  /** Optional: open a different PO (used by inbound-credit cross-PO deep-link). */
  onOpenPurchaseOrder?: (purchaseOrderId: string, orderNumber?: string) => void;
}

// Status configuration for badges
const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
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
  onOpenPurchaseOrder,
}: SupplierLedgerSheetProps) {
  const { format: formatCurrency } = useCurrency();
  const [page, setPage] = useState(1);
  const limit = 20;

  // Payment state
  const [paymentPO, setPaymentPO] = useState<SupplierLedgerPurchaseOrder | null>(
    null,
  );
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [useSupplierCredit, setUseSupplierCredit] = useState(false);

  const { data: ledgerData, isLoading } = useSupplierLedger(
    supplier?._id ?? null,
    { page, limit },
  );
  const { data: accountsData } = useAccounts(
    isAccountsEnabled ? { status: "active", limit: 100 } : undefined,
  );
  const addPaymentMutation = useAddPurchasePayment();

  const ledger = ledgerData?.data;
  const purchaseOrders = ledger?.purchaseOrders || [];
  const payments = ledger?.payments || [];
  const returns = ledger?.returns || [];
  const inboundCredits = ledger?.inboundCredits || [];
  const ledgerCreditBalance =
    ledger?.creditBalance ?? supplier?.creditBalance ?? 0;
  const accounts =
    (accountsData as {
      items?: { _id: string; name: string; type?: string }[];
    })?.items ?? [];

  // Calculate summary from ledger data
  const totalPaid = purchaseOrders.reduce((sum, po) => sum + po.paidAmount, 0);
  const totalDue = purchaseOrders.reduce((sum, po) => sum + po.dueAmount, 0);
  const totalRefunded = returns.reduce((sum, r) => sum + (r.refundedAmount ?? 0), 0);
  const totalRefundCredit = returns.reduce(
    (sum, r) => sum + Math.max(0, (r.totalRefundAmount ?? 0) - (r.refundedAmount ?? 0)),
    0,
  );

  const handleStartPayment = (po: SupplierLedgerPurchaseOrder) => {
    setPaymentPO(po);
    setPaymentAmount(po.dueAmount.toFixed(2));
    setPaymentAccountId("");
    setPaymentMethod("cash");
    setPaymentNotes("");
    setUseSupplierCredit(false);
  };

  const handleCancelPayment = () => {
    setPaymentPO(null);
    setPaymentAmount("");
    setPaymentAccountId("");
    setPaymentMethod("cash");
    setPaymentNotes("");
    setUseSupplierCredit(false);
  };

  const handleSubmitPayment = async () => {
    if (!paymentPO) return;
    if (!useSupplierCredit && !paymentAccountId) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    try {
      await addPaymentMutation.mutateAsync({
        id: paymentPO._id,
        data: {
          paymentMethod: useSupplierCredit
            ? undefined
            : (paymentMethod as "cash" | "card" | "bank" | "mfs" | "other"),
          accountId: useSupplierCredit ? undefined : paymentAccountId,
          amount,
          notes: paymentNotes || undefined,
          useSupplierCredit: useSupplierCredit || undefined,
        },
      });
      handleCancelPayment();
    } catch {
      // Error handled by mutation
    }
  };

  // Combine purchase orders, payments, returns, and inbound credits into a unified ledger view
  type LedgerEntry =
    | { type: "purchaseOrder"; data: SupplierLedgerPurchaseOrder; date: Date }
    | { type: "payment"; data: SupplierLedgerPayment; date: Date }
    | { type: "return"; data: SupplierLedgerReturn; date: Date }
    | { type: "inboundCredit"; data: SupplierLedgerInboundCredit; date: Date };

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
    ...inboundCredits.map((credit) => ({
      type: "inboundCredit" as const,
      data: credit,
      date: new Date(credit.date),
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[550px] sm:max-w-[550px] flex flex-col h-full p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {paymentPO
              ? `Pay — ${paymentPO.invoiceNumber || paymentPO.orderNumber}`
              : `Supplier Ledger - ${supplier?.name}`}
          </SheetTitle>
          <SheetDescription>
            {paymentPO
              ? "Record a payment for this purchase order"
              : "Transaction history and account summary"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Summary Cards */}
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
                        totalDue > 0 ? "text-red-600" : "text-green-600",
                      )}
                    >
                      {isLoading ? (
                        <Skeleton className="h-6 w-20" />
                      ) : (
                        formatCurrency(totalDue)
                      )}
                    </p>
                  </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Refunded</p>
                      <p
                        className={cn(
                          "text-lg font-semibold",
                          totalRefunded > 0 ? "text-red-600" : "text-muted-foreground",
                        )}
                      >
                        {isLoading ? (
                          <Skeleton className="h-6 w-20" />
                        ) : (
                          formatCurrency(totalRefunded)
                        )}
                      </p>
                      {totalRefundCredit > 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          + {formatCurrency(totalRefundCredit)} credit
                        </p>
                      )}
                    </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Supplier Credit
                    </p>
                    <p
                      className={cn(
                        "text-lg font-semibold",
                        ledgerCreditBalance > 0
                          ? "text-blue-600"
                          : "text-muted-foreground",
                      )}
                    >
                      {formatCurrency(ledgerCreditBalance)}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Form — shown instead of ledger when paymentPO is set */}
          {paymentPO ? (
            <ScrollArea className="flex-1 px-6 overflow-y-auto">
              <div className="py-4 space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-muted-foreground"
                  onClick={handleCancelPayment}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Ledger
                </Button>

                <div className="rounded-lg border bg-muted/20 p-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Order</span>
                    <span className="font-mono font-medium">
                      {paymentPO.invoiceNumber || paymentPO.orderNumber}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">
                      {formatCurrency(paymentPO.invoiceAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(paymentPO.paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Due</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(paymentPO.dueAmount)}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sup-pay-amount">Payment Amount</Label>
                    <Input
                      id="sup-pay-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={
                        useSupplierCredit
                          ? Math.min(
                              paymentPO.dueAmount,
                              supplier?.creditBalance ?? 0,
                            )
                          : paymentPO.dueAmount
                      }
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>

                  {(supplier?.creditBalance ?? 0) > 0 && (
                    <div className="flex items-start justify-between gap-3 rounded-md border bg-muted/20 p-3">
                      <div className="space-y-0.5">
                        <Label
                          htmlFor="sup-use-credit"
                          className="text-sm font-medium"
                        >
                          Use supplier credit
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Available:{" "}
                          {formatCurrency(supplier?.creditBalance ?? 0)}
                        </p>
                      </div>
                      <Switch
                        id="sup-use-credit"
                        checked={useSupplierCredit}
                        onCheckedChange={(checked) => {
                          setUseSupplierCredit(checked);
                          if (checked) {
                            setPaymentAmount(
                              Math.min(
                                paymentPO.dueAmount,
                                supplier?.creditBalance ?? 0,
                              ).toFixed(2),
                            );
                          }
                        }}
                      />
                    </div>
                  )}

                  {!useSupplierCredit && (
                    <div className="space-y-2">
                      <Label htmlFor="sup-pay-account">Payment Account</Label>
                      <Select
                        value={paymentAccountId}
                        onValueChange={setPaymentAccountId}
                      >
                        <SelectTrigger id="sup-pay-account">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account._id} value={account._id}>
                              {account.name}
                              {account.type ? ` (${account.type})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {!useSupplierCredit && (
                    <div className="space-y-2">
                      <Label htmlFor="sup-pay-method">Payment Method</Label>
                      <Select
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                      >
                        <SelectTrigger id="sup-pay-method">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                          <SelectItem value="mfs">Mobile Banking</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="sup-pay-notes">Notes (optional)</Label>
                    <Textarea
                      id="sup-pay-notes"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      placeholder="Add notes..."
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCancelPayment}
                      disabled={addPaymentMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleSubmitPayment}
                      disabled={
                        addPaymentMutation.isPending ||
                        (!useSupplierCredit && !paymentAccountId) ||
                        !paymentAmount
                      }
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {addPaymentMutation.isPending
                        ? "Processing..."
                        : "Record Payment"}
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            /* Ledger Entries */
            <>
              <ScrollArea className="flex-1 px-6 overflow-y-auto">
                <div className="py-4 space-y-3">
                  {isLoading ? (
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
                        key={`${entry.type}-${
                          entry.type === "inboundCredit"
                            ? entry.data.returnId
                            : entry.data._id
                        }-${index}`}
                        className="rounded-lg border p-4 space-y-2"
                      >
                        {entry.type === "purchaseOrder" ? (
                          <>
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {entry.data.invoiceNumber ||
                                    entry.data.orderNumber}
                                </span>
                                <Badge
                                  variant={
                                    statusConfig[entry.data.status]?.variant ||
                                    "secondary"
                                  }
                                >
                                  {statusConfig[entry.data.status]?.label ||
                                    entry.data.status}
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {format(entry.date, "dd MMM yyyy")}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  Amount:
                                </span>{" "}
                                <span className="font-medium">
                                  {formatCurrency(entry.data.invoiceAmount)}
                                </span>
                              </div>
                              {isAccountsEnabled && (
                                <>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Paid:
                                    </span>{" "}
                                    <span className="font-medium text-green-600">
                                      {formatCurrency(entry.data.paidAmount)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Due:
                                    </span>{" "}
                                    <span
                                      className={cn(
                                        "font-medium",
                                        entry.data.dueAmount > 0
                                          ? "text-red-600"
                                          : "text-green-600",
                                      )}
                                    >
                                      {formatCurrency(entry.data.dueAmount)}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                            {isAccountsEnabled &&
                              entry.data.dueAmount > 0 &&
                              entry.data.status !== "cancelled" && (
                                <div className="flex justify-end pt-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs gap-1"
                                    onClick={() =>
                                      handleStartPayment(entry.data)
                                    }
                                  >
                                    <CreditCard className="h-3.5 w-3.5" />
                                    Pay Due
                                  </Button>
                                </div>
                              )}
                          </>
                        ) : entry.type === "return" ? (
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
                                <span className="text-muted-foreground">
                                  Original Order:
                                </span>{" "}
                                <span>{entry.data.orderNumber}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Refund Amount:
                                </span>{" "}
                                <span className="font-medium text-orange-600">
                                  {formatCurrency(entry.data.totalRefundAmount)}
                                </span>
                              </div>
                              {isAccountsEnabled &&
                                entry.data.refundedAmount > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Cash Refunded:
                                    </span>{" "}
                                    <span className="font-medium text-green-600">
                                      {formatCurrency(entry.data.refundedAmount)}
                                    </span>
                                  </div>
                                )}
                              {isAccountsEnabled &&
                                entry.data.totalRefundAmount >
                                  entry.data.refundedAmount && (
                                  <div>
                                    <span className="text-muted-foreground">
                                      Due Adjusted:
                                    </span>{" "}
                                    <span className="font-medium text-blue-600">
                                      {formatCurrency(
                                        entry.data.totalRefundAmount -
                                          entry.data.refundedAmount,
                                      )}
                                    </span>
                                  </div>
                                )}
                            </div>
                          </>
                        ) : entry.type === "inboundCredit" ? (
                          // Inbound credit applied from another PO's return
                          <>
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <Undo2 className="h-4 w-4 text-blue-600" />
                                <span className="font-medium text-blue-600">
                                  Credit Applied
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {format(entry.date, "dd MMM yyyy")}
                              </span>
                            </div>
                            <div className="text-sm space-y-1">
                              <div>
                                <span className="text-muted-foreground">
                                  From return:
                                </span>{" "}
                                <span className="font-mono">
                                  {entry.data.returnNumber}
                                </span>
                                {entry.data.sourceOrderNumber && (
                                  <>
                                    {" "}
                                    <span className="text-muted-foreground">
                                      (PO
                                    </span>{" "}
                                    {onOpenPurchaseOrder &&
                                    entry.data.sourcePurchaseOrderId ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onOpenPurchaseOrder(
                                            entry.data.sourcePurchaseOrderId,
                                            entry.data.sourceOrderNumber,
                                          )
                                        }
                                        className="font-mono text-primary hover:underline"
                                      >
                                        {entry.data.sourceOrderNumber}
                                      </button>
                                    ) : (
                                      <span className="font-mono">
                                        {entry.data.sourceOrderNumber}
                                      </span>
                                    )}
                                    <span className="text-muted-foreground">
                                      )
                                    </span>
                                  </>
                                )}
                              </div>
                              {entry.data.targetOrderNumber && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Applied to:
                                  </span>{" "}
                                  {onOpenPurchaseOrder &&
                                  entry.data.targetPurchaseOrderId ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onOpenPurchaseOrder(
                                          entry.data.targetPurchaseOrderId,
                                          entry.data.targetOrderNumber,
                                        )
                                      }
                                      className="font-mono text-primary hover:underline"
                                    >
                                      {entry.data.targetOrderNumber}
                                    </button>
                                  ) : (
                                    <span className="font-mono">
                                      {entry.data.targetOrderNumber}
                                    </span>
                                  )}
                                </div>
                              )}
                              <div>
                                <span className="text-muted-foreground">
                                  Amount:
                                </span>{" "}
                                <span className="font-medium text-blue-600">
                                  {formatCurrency(entry.data.amount)}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : entry.data.type === "purchase_return" ? (
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
                                <span className="text-muted-foreground">
                                  Amount:
                                </span>{" "}
                                <span className="font-medium text-green-600">
                                  {formatCurrency(entry.data.amount)}
                                </span>
                              </div>
                              {entry.data.referenceId && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Order:
                                  </span>{" "}
                                  <span>
                                    {entry.data.referenceId.invoiceNumber ||
                                      entry.data.referenceId.orderNumber}
                                  </span>
                                </div>
                              )}
                              {entry.data.accountId && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Account:
                                  </span>{" "}
                                  <span>{entry.data.accountId.name}</span>
                                </div>
                              )}
                            </div>
                          </>
                        ) : entry.data.type === "purchase_cancelled" ? (
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
                                <span className="text-muted-foreground">
                                  Amount:
                                </span>{" "}
                                <span className="font-medium text-blue-600">
                                  {formatCurrency(entry.data.amount)}
                                </span>
                              </div>
                              {entry.data.referenceId && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Order:
                                  </span>{" "}
                                  <span>
                                    {entry.data.referenceId.invoiceNumber ||
                                      entry.data.referenceId.orderNumber}
                                  </span>
                                </div>
                              )}
                              {entry.data.accountId && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Account:
                                  </span>{" "}
                                  <span>{entry.data.accountId.name}</span>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
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
                                <span className="text-muted-foreground">
                                  Amount:
                                </span>{" "}
                                <span className="font-medium text-red-600">
                                  {formatCurrency(entry.data.amount)}
                                </span>
                              </div>
                              {entry.data.referenceId && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Order:
                                  </span>{" "}
                                  <span>
                                    {entry.data.referenceId.invoiceNumber ||
                                      entry.data.referenceId.orderNumber}
                                  </span>
                                </div>
                              )}
                              {entry.data.accountId && (
                                <div>
                                  <span className="text-muted-foreground">
                                    Account:
                                  </span>{" "}
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
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
