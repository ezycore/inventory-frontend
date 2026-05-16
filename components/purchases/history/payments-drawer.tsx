"use client";

import { format } from "date-fns";
import {
  Boxes,
  ClipboardList,
  CreditCard,
  ReceiptText,
  RotateCcw,
  Wallet,
} from "lucide-react";
import type { ReactNode } from "react";
import { useRef } from "react";
import { Badge } from "@/ui/components/badge";
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
import { Separator } from "@/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { Skeleton } from "@/ui/components/skeleton";
import { Textarea } from "@/ui/components/textarea";
import type { Account, PurchaseOrder, PurchaseReturn } from "@/types";
import type { Payment } from "./types";

interface PaymentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOrder: PurchaseOrder | null;
  payments: Payment[];
  isLoadingPayments: boolean;
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
  mode: "summary" | "payment";
  accounts: Account[];
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  paymentAccountId: string;
  setPaymentAccountId: (v: string) => void;
  paymentMethod: string;
  setPaymentMethod: (v: string) => void;
  paymentNotes: string;
  setPaymentNotes: (v: string) => void;
  isSubmittingPayment: boolean;
  onMakePayment: (order: PurchaseOrder) => void;
  onSubmitPayment: () => void;
  drawerRef?: React.RefObject<HTMLDivElement | null>;
  purchaseReturns: PurchaseReturn[];
  isLoadingReturns: boolean;
}

function renderField(label: string, value: ReactNode) {
  return (
    <div className="space-y-1 rounded-lg border bg-muted/30 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="break-words text-sm font-medium">{value}</div>
    </div>
  );
}

function getSupplierName(order: PurchaseOrder): string {
  const s =
    (order.supplierId as unknown as { name?: string }) ||
    (order.supplier as unknown as { name?: string });
  return (s && typeof s === "object" && s.name) || "Unknown Supplier";
}

function getCreatedByName(order: PurchaseOrder): string {
  const cb = order.createdBy;
  if (cb && typeof cb === "object") {
    const fn = (cb as { firstName?: string }).firstName;
    const ln = (cb as { lastName?: string }).lastName;
    const name = [fn, ln].filter(Boolean).join(" ").trim();
    if (name) return name;
    const email = (cb as { email?: string }).email;
    if (email) return email;
  }
  return "-";
}

export function PaymentsDrawer({
  open,
  onOpenChange,
  selectedOrder: order,
  payments,
  isLoadingPayments,
  isAccountsEnabled,
  formatCurrency,
  mode,
  accounts,
  paymentAmount,
  setPaymentAmount,
  paymentAccountId,
  setPaymentAccountId,
  paymentMethod,
  setPaymentMethod,
  paymentNotes,
  setPaymentNotes,
  isSubmittingPayment,
  onMakePayment,
  onSubmitPayment,
  drawerRef: externalRef,
  purchaseReturns,
  isLoadingReturns,
}: PaymentsDrawerProps) {
  const internalRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = externalRef || internalRef;

  const dueAmount = order?.dueAmount || 0;
  const subtotal = order?.subtotal || 0;
  const taxTotal = order?.taxTotal || 0;
  const additionalDiscount = order?.additionalDiscount || 0;
  const invoiceAmount = order?.invoiceAmount || 0;
  const paidAmount = order?.paidAmount || 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[760px] sm:max-w-[760px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5" />
            {mode === "payment" ? "Record Payment" : "Purchase Summary"}
            {order ? ` — ${order.orderNumber}` : ""}
          </SheetTitle>
          <SheetDescription>
            {mode === "payment"
              ? "Review the purchase order and submit a payment"
              : "Full purchase details and payment history"}
          </SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {order && (
            <div className="mt-6 space-y-6 px-2">
              {/* Payment Form (visible in payment mode) */}
              {mode === "payment" &&
                isAccountsEnabled &&
                dueAmount > 0 &&
                order.status !== "cancelled" && (
                  <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">
                          Payment entry
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Due amount: {formatCurrency(dueAmount)}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {order.status}
                      </Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pay-amount">Payment Amount</Label>
                        <Input
                          id="pay-amount"
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={dueAmount}
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder="Enter amount"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pay-method">Payment Method</Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={setPaymentMethod}
                        >
                          <SelectTrigger id="pay-method">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="bank">Bank Transfer</SelectItem>
                            <SelectItem value="mfs">MFS</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="pay-account">Payment Account</Label>
                        <Select
                          value={paymentAccountId}
                          onValueChange={setPaymentAccountId}
                        >
                          <SelectTrigger id="pay-account">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem
                                key={account._id}
                                value={account._id}
                              >
                                {account.name}
                                {account.type ? ` (${account.type})` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="pay-notes">Notes</Label>
                        <Textarea
                          id="pay-notes"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          placeholder="Add notes about this payment..."
                          rows={2}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmittingPayment}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={onSubmitPayment}
                        disabled={
                          isSubmittingPayment ||
                          !paymentAccountId ||
                          !paymentAmount
                        }
                      >
                        {isSubmittingPayment
                          ? "Processing..."
                          : "Record Payment"}
                      </Button>
                    </div>
                  </div>
                )}

              {/* Order Details */}
              <div className="grid gap-4 lg:grid-cols-2">
                {renderField("Invoice #", order.orderNumber)}
                {renderField(
                  "Status",
                  <Badge variant="outline" className="capitalize">
                    {order.status}
                  </Badge>,
                )}
                {renderField("Supplier", getSupplierName(order))}
                {renderField("Created By", getCreatedByName(order))}
                {renderField(
                  "Created At",
                  format(new Date(order.createdAt), "dd MMM yyyy HH:mm"),
                )}
                {renderField(
                  "Updated At",
                  format(new Date(order.updatedAt), "dd MMM yyyy HH:mm"),
                )}
              </div>

              {/* Money Summary */}
              <div className="grid gap-4 lg:grid-cols-3">
                {renderField("Subtotal", formatCurrency(subtotal))}
                {renderField("Tax Total", formatCurrency(taxTotal))}
                {renderField(
                  "Additional Discount",
                  formatCurrency(additionalDiscount),
                )}
                {renderField("Total Amount", formatCurrency(invoiceAmount))}
                {renderField(
                  "Paid Amount",
                  <span className="text-green-600">
                    {formatCurrency(paidAmount)}
                  </span>,
                )}
                {renderField(
                  "Due Amount",
                  <span
                    className={
                      dueAmount > 0 ? "text-red-600" : "text-green-600"
                    }
                  >
                    {formatCurrency(dueAmount)}
                  </span>,
                )}
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <ClipboardList className="h-4 w-4" />
                    Notes
                  </div>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              )}

              {/* Items */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center gap-2 font-medium">
                  <Boxes className="h-4 w-4" />
                  Items ({order.items.length})
                </div>

                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div
                      key={`${item.productId}-${index}`}
                      className="space-y-3 rounded-lg bg-muted/30 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">
                            {item.productName ||
                              item.product?.name ||
                              "Product"}
                          </div>
                          {item.variantName && (
                            <div className="text-xs text-muted-foreground">
                              {item.variantName}
                            </div>
                          )}
                        </div>

                        <Badge variant="outline" className="shrink-0">
                          Qty {item.quantity}
                        </Badge>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {renderField("Price", formatCurrency(item.price))}
                        {renderField(
                          "Discount",
                          formatCurrency(item.discount || 0),
                        )}
                        {renderField("Subtotal", formatCurrency(item.subtotal))}
                        {renderField(
                          "Received",
                          `${item.receivedQuantity ?? 0}/${item.quantity}`,
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Returns History */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <RotateCcw className="h-4 w-4" />
                  Returns (
                  {isLoadingReturns ? "…" : purchaseReturns.length})
                </div>

                <Separator />

                {isLoadingReturns ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : purchaseReturns.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <RotateCcw className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p className="text-sm">No returns for this purchase</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {purchaseReturns.map((ret) => (
                      <div
                        key={ret._id}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-sm">
                              {ret.returnNumber}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(
                                new Date(ret.createdAt),
                                "dd MMM yyyy HH:mm",
                              )}
                            </div>
                          </div>
                          <Badge
                            variant={
                              ret.status === "completed"
                                ? "default"
                                : ret.status === "cancelled"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="capitalize shrink-0"
                          >
                            {ret.status}
                          </Badge>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          {renderField(
                            "Reason",
                            <span className="capitalize">
                              {ret.reason.replace(/_/g, " ")}
                            </span>,
                          )}
                          {renderField(
                            "Items",
                            `${ret.items.reduce((s, i) => s + i.quantity, 0)} unit(s) across ${ret.items.length} product(s)`,
                          )}
                          {renderField(
                            "Refund Amount",
                            <span className="text-red-600">
                              -{formatCurrency(ret.totalRefundAmount)}
                            </span>,
                          )}
                        </div>

                        {ret.items.length > 0 && (
                          <div className="mt-2 rounded-md bg-muted/50 p-2 space-y-1">
                            <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                              Returned Items
                            </div>
                            {ret.items.map((item, idx) => (
                              <div
                                key={`${item.productId}-${idx}`}
                                className="flex items-center justify-between text-xs py-1.5 border-b last:border-0 border-muted"
                              >
                                <div className="flex-1 min-w-0">
                                  <span className="font-medium truncate block">
                                    {item.productName || "Product"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 ml-2 shrink-0 text-muted-foreground">
                                  <span>
                                    Qty:{" "}
                                    <span className="text-foreground font-medium">
                                      {item.quantity}
                                    </span>
                                  </span>
                                  <span>@ {formatCurrency(item.price)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {ret.notes && (
                          <p className="text-xs text-muted-foreground">
                            {ret.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment History */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-medium">Payment History</div>
                  {isAccountsEnabled &&
                    dueAmount > 0 &&
                    order.status !== "cancelled" &&
                    mode !== "payment" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onMakePayment(order);
                          if (scrollRef?.current) {
                            scrollRef.current.scrollTop = 0;
                          }
                        }}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Add Payment
                      </Button>
                    )}
                </div>

                <Separator />

                {isLoadingPayments ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : payments.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Wallet className="mx-auto mb-3 h-10 w-10 opacity-50" />
                    <p>No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment) => (
                      <div
                        key={payment._id}
                        className="space-y-2 rounded-lg border p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-green-600">
                              +{formatCurrency(payment.amount)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(
                                new Date(payment.createdAt),
                                "dd MMM yyyy HH:mm",
                              )}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="capitalize"
                          >
                            {payment.paymentMethod}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Wallet className="h-3 w-3" />
                          {(payment as { accountId?: { name?: string } })
                            .accountId?.name || "Unknown Account"}
                        </div>

                        {payment.notes && (
                          <p className="text-sm text-muted-foreground">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
