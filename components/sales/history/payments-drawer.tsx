'use client';

import { format } from 'date-fns';
import {
  CreditCard,
  Hash,
  Package,
  ReceiptText,
  User,
  Boxes,
  ClipboardList,
  Wallet,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/components/select';
import { Separator } from '@/ui/components/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/components/sheet';
import { Skeleton } from '@/ui/components/skeleton';
import { Switch } from '@/ui/components/switch';
import { Textarea } from '@/ui/components/textarea';
import type {
  Account,
  Payment,
  Sale,
  SalesReturn,
  SaleTransactionEntry,
  SaleTransactionsResponse,
} from '@/types';
import { InfoField } from '@/components/shared/info-field';

interface PaymentsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  payments: Payment[];
  isLoadingPayments: boolean;
  isAccountsEnabled: boolean;
  formatCurrency: (n: number) => string;
  mode: 'summary' | 'payment';
  accounts: Account[];
  paymentAmount: string;
  setPaymentAmount: (value: string) => void;
  paymentAccountId: string;
  setPaymentAccountId: (value: string) => void;
  paymentNotes: string;
  setPaymentNotes: (value: string) => void;
  useCreditBalance: boolean;
  setUseCreditBalance: (value: boolean) => void;
  isSubmittingPayment: boolean;
  onMakePayment: (sale: Sale) => void;
  onSubmitPayment: () => void;
  drawerRef?: React.RefObject<HTMLDivElement>;
  saleReturns: SalesReturn[];
  isLoadingReturns: boolean;
  transactions?: SaleTransactionsResponse;
  isLoadingTransactions?: boolean;
}

export function PaymentsDrawer({
  open,
  onOpenChange,
  sale,
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
  paymentNotes,
  setPaymentNotes,
  useCreditBalance,
  setUseCreditBalance,
  isSubmittingPayment,
  onMakePayment,
  onSubmitPayment,
  drawerRef: externalRef,
  saleReturns,
  isLoadingReturns,
  transactions,
  isLoadingTransactions,
}: PaymentsDrawerProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const scrollRef = externalRef || internalRef;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[760px] sm:max-w-[760px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5" />
            {mode === 'payment' ? 'Record Payment' : 'Sale Summary'}
            {sale ? ` — ${sale.invoiceNumber}` : ''}
          </SheetTitle>
          <SheetDescription>
            {mode === 'payment'
              ? 'Review the sale and submit a payment'
              : 'Full sale details and payment history'}
          </SheetDescription>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {sale && (
            <div className="mt-6 space-y-6 px-2">
              {/* Payment Form (visible in payment mode) */}
              {mode === 'payment' && isAccountsEnabled && sale.dueAmount > 0 && sale.status !== 'cancelled' && (
                <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">Payment entry</div>
                      <div className="text-sm text-muted-foreground">
                        Due amount: {formatCurrency(sale.dueAmount)}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {sale.status}
                    </Badge>
                  </div>

                  {(sale.customerId?.creditBalance ?? 0) > 0 && (
                    <div className="flex items-center justify-between rounded-md border bg-blue-50 px-3 py-2 dark:bg-blue-950/20">
                      <div className="text-sm">
                        <div className="font-medium">Use store credit</div>
                        <div className="text-xs text-muted-foreground">
                          Available: {formatCurrency(sale.customerId?.creditBalance ?? 0)}
                        </div>
                      </div>
                      <Switch
                        checked={useCreditBalance}
                        onCheckedChange={setUseCreditBalance}
                        disabled={isSubmittingPayment}
                      />
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pay-amount">Payment Amount</Label>
                      <Input
                        id="pay-amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={
                          useCreditBalance
                            ? Math.min(sale.dueAmount, sale.customerId?.creditBalance ?? 0)
                            : sale.dueAmount
                        }
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>

                    {!useCreditBalance && (
                      <div className="space-y-2">
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
                              <SelectItem key={account._id} value={account._id}>
                                {account.name}
                                {account.type ? ` (${account.type})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

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
                        !paymentAmount ||
                        (!useCreditBalance && !paymentAccountId)
                      }
                    >
                      {isSubmittingPayment ? 'Processing...' : 'Record Payment'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Sale Details */}
              <div className="grid gap-4 lg:grid-cols-2">
                <InfoField label="Invoice #" value={sale.invoiceNumber} />
                <InfoField label="Status" value={<Badge variant="outline" className="capitalize">{sale.status}</Badge>} />
                <InfoField label="Customer" value={sale.customerId?.name ?? 'Walk-in Customer'} />
                <InfoField label="Created By" value={sale.createdBy ? `${sale.createdBy.firstName} ${sale.createdBy.lastName}` : '-'} />
                <InfoField label="Created At" value={format(new Date(sale.createdAt), 'dd MMM yyyy HH:mm')} />
                <InfoField label="Updated At" value={format(new Date(sale.updatedAt), 'dd MMM yyyy HH:mm')} />
              </div>

              {/* Money Summary */}
              <div className="grid gap-4 lg:grid-cols-3">
                <InfoField label="Subtotal" value={sale.subtotal} showCurrency />
                <InfoField label="Additional Discount" value={sale.additionalDiscount} showCurrency />
                <InfoField label="Total Amount" value={sale.totalAmount} showCurrency />
                <InfoField label="Paid Amount" value={sale.paidAmount} showCurrency valueClassName="text-green-600" />
                <InfoField label="Due Amount" value={sale.dueAmount} showCurrency valueClassName={sale.dueAmount > 0 ? 'text-red-600' : 'text-green-600'} />
                <InfoField label="Cost Price" value={sale.costPrice} showCurrency />
              </div>

              {/* Notes */}
              {sale.notes && (
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center gap-2 font-medium">
                    <ClipboardList className="h-4 w-4" />
                    Notes
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {sale.notes}
                  </p>
                </div>
              )}

              {/* Items */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center gap-2 font-medium">
                  <Boxes className="h-4 w-4" />
                  Items ({sale.items.length})
                </div>

                <div className="space-y-3">
                  {sale.items.map((item, index) => (
                    <div
                      key={`${item.productId}-${index}`}
                      className="space-y-3 rounded-lg bg-muted/30 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{item.productName}</div>
                        </div>

                        <Badge variant="outline" className="shrink-0">
                          Qty {item.quantity}
                        </Badge>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <InfoField label="Price" value={item.price} showCurrency quantity={item.quantity} />
                        <InfoField label="Discount" value={item.discount} showCurrency quantity={item.discount ? item.quantity : 0}/>
                        <InfoField label="Subtotal" value={item.subtotal} showCurrency/>
                        <InfoField label="Cost Price" value={item.costPrice} showCurrency quantity={item.quantity}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Returns History */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <RotateCcw className="h-4 w-4" />
                  Returns ({isLoadingReturns ? '…' : saleReturns.length})
                </div>

                <Separator />

                {isLoadingReturns ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : saleReturns.length === 0 ? (
                  <div className="py-6 text-center text-muted-foreground">
                    <RotateCcw className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p className="text-sm">No returns for this sale</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {saleReturns.map((ret) => (
                      <div key={ret._id} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-sm">{ret.returnNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(ret.createdAt), 'dd MMM yyyy HH:mm')}
                            </div>
                          </div>
                          <Badge
                            variant={
                              ret.status === 'completed'
                                ? 'default'
                                : ret.status === 'cancelled'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="capitalize shrink-0"
                          >
                            {ret.status}
                          </Badge>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <InfoField
                            label="Reason"
                            value={<span className="capitalize">{ret.reason.replace(/_/g, ' ')}</span>}
                          />
                          <InfoField
                            label="Items"
                            value={`${ret.items.reduce((s, i) => s + i.quantity, 0)} unit(s) across ${ret.items.length} product(s)`}
                          />
                          {(ret.deductionAmount ?? 0) > 0 && (
                            <InfoField
                              label="Gross Refund"
                              value={<span className="text-muted-foreground">-{formatCurrency(ret.totalRefundAmount + ret.deductionAmount!)}</span>}
                            />
                          )}
                          {(ret.deductionAmount ?? 0) > 0 && (
                            <InfoField
                              label="Deduction / Fee"
                              value={<span className="text-destructive">-{formatCurrency(ret.deductionAmount!)}</span>}
                            />
                          )}
                          <InfoField
                            label={(ret.deductionAmount ?? 0) > 0 ? 'Net Refund' : 'Refund Amount'}
                            value={<span className="text-red-600">-{formatCurrency(ret.totalRefundAmount)}</span>}
                          />
                        </div>

                        {/* Item-level breakdown */}
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
                                  <span className="font-medium truncate block">{item.productName}</span>
                                </div>
                                <div className="flex items-center gap-3 ml-2 shrink-0 text-muted-foreground">
                                  <span>Qty: <span className="text-foreground font-medium">{item.quantity}</span></span>
                                  <span>@ {formatCurrency(item.price)}</span>
                                  <span className="text-red-600 font-medium">-{formatCurrency(item.refundAmount)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Refund Allocation Breakdown */}
                        {ret.refundAllocation && (
                          (ret.refundAllocation.adjustSaleDue ?? 0) > 0 ||
                          (ret.refundAllocation.adjustOtherDues?.length ?? 0) > 0 ||
                          ret.refundAllocation.accountRefund ||
                          (ret.refundAllocation.customerCredit?.amount ?? 0) > 0
                        ) && (
                          <div className="mt-1.5 rounded-md bg-blue-50 dark:bg-blue-950/20 px-2.5 py-2 space-y-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                              Refund Allocation
                            </div>
                            {(ret.refundAllocation.adjustSaleDue ?? 0) > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Adjusted against sale due</span>
                                <span className="font-medium text-blue-600">
                                  {formatCurrency(ret.refundAllocation.adjustSaleDue!)}
                                </span>
                              </div>
                            )}
                            {ret.refundAllocation.adjustOtherDues?.map((d, i) => (
                              <div key={i} className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground flex items-center gap-1.5">
                                  Adjusted against
                                  {d.invoiceNumber ? (
                                    <CopyableInvoice value={d.invoiceNumber} />
                                  ) : (
                                    'other due'
                                  )}
                                </span>
                                <span className="font-medium text-blue-600">{formatCurrency(d.amount)}</span>
                              </div>
                            ))}
                            {ret.refundAllocation.accountRefund && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Cash refund
                                  {ret.refundAllocation.accountRefund.paymentMethod
                                    ? ` (${ret.refundAllocation.accountRefund.paymentMethod})`
                                    : ''}
                                </span>
                                <span className="font-medium text-green-600">
                                  {formatCurrency(ret.refundAllocation.accountRefund.amount)}
                                </span>
                              </div>
                            )}
                            {(ret.refundAllocation.customerCredit?.amount ?? 0) > 0 && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Converted to store credit</span>
                                <span className="font-medium text-blue-600">
                                  {formatCurrency(ret.refundAllocation.customerCredit!.amount)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {ret.notes && (
                          <p className="text-xs text-muted-foreground">{ret.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transactions Timeline (merged: payments + refunds + return credits) */}
              <TransactionsTimeline
                transactions={transactions}
                isLoading={!!isLoadingTransactions}
                formatCurrency={formatCurrency}
              />

              {/* Payment History */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-medium">Payment History</div>
                  {isAccountsEnabled && sale.dueAmount > 0 && sale.status !== 'cancelled' && mode !== 'payment' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onMakePayment(sale);
                        // Scroll to top of drawer content
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
                      <div key={payment._id} className="space-y-2 rounded-lg border p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium text-green-600">
                              +{formatCurrency(payment.amount)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(payment.createdAt), 'dd MMM yyyy HH:mm')}
                            </div>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {payment.paymentMethod}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Wallet className="h-3 w-3" />
                          {payment.accountId?.name || 'Unknown Account'}
                        </div>

                        {payment.notes && (
                          <p className="text-sm text-muted-foreground">{payment.notes}</p>
                        )}

                        {payment.createdBy && (
                          <p className="text-xs text-muted-foreground">
                            By {payment.createdBy.firstName} {payment.createdBy.lastName}
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

// ── Transactions Timeline ─────────────────────────────────────────────

const KIND_META: Record<
  SaleTransactionEntry['kind'],
  { label: string; tone: 'in' | 'out' | 'neutral' }
> = {
  payment:                    { label: 'Cash payment',         tone: 'in' },
  credit_balance_payment:     { label: 'Store credit applied', tone: 'in' },
  cash_refund:                { label: 'Cash refund',          tone: 'out' },
  credit_applied_self:        { label: 'Return credit',        tone: 'neutral' },
  credit_applied_from_other:  { label: 'Credit from other sale', tone: 'neutral' },
};

function TransactionsTimeline({
  transactions,
  isLoading,
  formatCurrency,
}: {
  transactions?: SaleTransactionsResponse;
  isLoading: boolean;
  formatCurrency: (n: number) => string;
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="font-medium flex items-center gap-2">
        <Hash className="h-4 w-4" />
        Transactions
        {transactions && (
          <span className="text-xs text-muted-foreground font-normal">
            ({transactions.transactions.length})
          </span>
        )}
      </div>
      <Separator />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : !transactions ? (
        <div className="py-6 text-center text-muted-foreground text-sm">
          No transactions
        </div>
      ) : (
        <>
          {/* Summary chips */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <SummaryChip label="Cash paid"    value={formatCurrency(transactions.summary.cashPaid)}            tone="in" />
            <SummaryChip label="Credit paid"  value={formatCurrency(transactions.summary.creditBalancePaid)}   tone="neutral" />
            <SummaryChip label="Cash refund"  value={formatCurrency(transactions.summary.cashRefunded)}        tone="out" />
            <SummaryChip label="Refund credit" value={formatCurrency(transactions.summary.refundCreditApplied)} tone="neutral" />
            <SummaryChip label="Net received" value={formatCurrency(transactions.summary.netReceived)}         tone="in" />
            <SummaryChip label="Due"          value={formatCurrency(transactions.summary.dueAmount)}           tone={transactions.summary.dueAmount > 0 ? 'out' : 'in'} />
          </div>

          {/* Timeline */}
          {transactions.transactions.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground text-sm">
              No transactions recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.transactions.map((t) => {
                const meta = KIND_META[t.kind];
                const sign = t.direction === 'out' ? '-' : t.direction === 'in' ? '+' : '';
                const color =
                  t.direction === 'in'
                    ? 'text-green-600'
                    : t.direction === 'out'
                      ? 'text-red-600'
                      : 'text-blue-600';
                return (
                  <div key={t.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                    <div className="min-w-0 space-y-1">
                      <div className="text-sm font-medium">{meta.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(t.date), 'dd MMM yyyy HH:mm')}
                        {t.accountName ? ` · ${t.accountName}` : ''}
                        {t.paymentMethod ? ` · ${t.paymentMethod}` : ''}
                      </div>
                      {t.sourceSale && (
                        <div className="text-xs text-muted-foreground">
                          From sale <span className="font-mono">{t.sourceSale.invoiceNumber}</span>
                        </div>
                      )}
                      {t.reference?.label && (
                        <div className="text-xs text-muted-foreground">
                          Ref: <span className="font-mono">{t.reference.label}</span>
                        </div>
                      )}
                      {t.notes && (
                        <div className="text-xs text-muted-foreground">{t.notes}</div>
                      )}
                    </div>
                    <div className={`text-sm font-semibold shrink-0 ${color}`}>
                      {sign}{formatCurrency(t.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'in' | 'out' | 'neutral';
}) {
  const color =
    tone === 'in' ? 'text-green-600' : tone === 'out' ? 'text-red-600' : 'text-blue-600';
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`text-sm font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function CopyableInvoice({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`Copied ${value}`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Failed to copy');
    }
  };
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono font-medium text-primary">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-5 w-5"
        onClick={handleCopy}
        aria-label={`Copy ${value}`}
      >
        {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
      </Button>
    </span>
  );
}
