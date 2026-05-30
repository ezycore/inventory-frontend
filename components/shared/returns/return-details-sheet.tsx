'use client';

import { format } from 'date-fns';
import {
  Package,
  RotateCcw,
  User,
  Truck,
  Wallet,
  ClipboardList,
  Copy,
  Check,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { Separator } from '@/ui/components/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/components/sheet';
import { Skeleton } from '@/ui/components/skeleton';
import { InfoField } from '@/components/shared/info-field';
import { CopyField } from '@/ui/components/copy';

// ── Normalized data types ────────────────────────────────────────────────────

export interface ReturnDetailsItem {
  productId: string;
  productName: string;
  quantity: number;
  /** Present for sales returns (shown as "Sale Price") */
  price?: number;
  costPrice: number;
  discount?: number;
  /** Present for purchase returns (UoM conversion) */
  conversionFactor?: number;
  refundAmount: number;
}

export interface ReturnDetailsData {
  returnNumber: string;
  status: string;
  /** invoiceNumber for sales, orderNumber for purchases */
  documentRef: string;
  /** customerName or supplierName */
  counterpartyName: string | null;
  /** ISO date string */
  date: string;
  reason?: string;
  totalRefundAmount: number;
  deductionAmount?: number;
  refundedAmount?: number;
  totalCostAmount?: number;
  notes?: string;
  items: ReturnDetailsItem[];
  refundAllocation?: {
    /** Mapped from adjustSaleDue or adjustPurchaseDue */
    adjustDocumentDue?: number;
    adjustOtherDues?: { amount: number; referenceLabel?: string }[];
    accountRefund?: { amount: number; paymentMethod: string };
    /** Refund converted into counterparty store credit (customer for sales, supplier for purchases). */
    counterpartyCredit?: { amount: number };
  };
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
          Processed
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-0">
          Pending
        </Badge>
      );
    case 'cancelled':
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ── Variant config ───────────────────────────────────────────────────────────

const VARIANT_CONFIG = {
  sales: {
    counterpartyLabel: 'Customer',
    CounterpartyIcon: User,
    counterpartyFallback: 'Walk-in Customer',
    documentLabel: 'Original Invoice',
    sheetDescription: 'Full details of this sales return transaction',
    totalRefundColor: 'text-red-600',
    totalRefundPrefix: '-',
    cashRefundColor: 'text-orange-600',
    adjustDocumentDueLabel: 'Adjusted against sale due',
    counterpartyCreditLabel: 'Customer Credit',
    creditConversionLabel: 'Converted to store credit',
    refundAmountColor: 'text-red-600',
    refundBgClass: 'bg-red-50 dark:bg-red-950/30',
    showSalePrice: true,
  },
  purchases: {
    counterpartyLabel: 'Supplier',
    CounterpartyIcon: Truck,
    counterpartyFallback: 'Unknown supplier',
    documentLabel: 'Original Order',
    sheetDescription: 'Full details of this purchase return transaction',
    totalRefundColor: 'text-orange-600',
    totalRefundPrefix: '',
    cashRefundColor: 'text-green-600',
    adjustDocumentDueLabel: 'Adjusted against supplier due',
    counterpartyCreditLabel: 'Supplier Credit',
    creditConversionLabel: 'Adjusted to supplier credit',
    refundAmountColor: 'text-orange-600',
    refundBgClass: 'bg-orange-50 dark:bg-orange-950/30',
    showSalePrice: false,
  },
} as const;

// ── Component ────────────────────────────────────────────────────────────────

interface ReturnDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnData: ReturnDetailsData | null;
  formatCurrency: (n: number) => string;
  isLoading?: boolean;
  variant: 'sales' | 'purchases';
}

export function ReturnDetailsSheet({
  open,
  onOpenChange,
  returnData,
  formatCurrency,
  isLoading,
  variant,
}: ReturnDetailsSheetProps) {
  if (!returnData && !isLoading) return null;

  const cfg = VARIANT_CONFIG[variant];
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[680px] sm:max-w-[680px] flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Return Details
            {returnData?.returnNumber ? ` — ${returnData.returnNumber}` : ''}
          </SheetTitle>
          <SheetDescription>{cfg.sheetDescription}</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-6 space-y-4 px-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : returnData ? (
          <div className="mt-6 space-y-6 px-2">
            {/* Header fields */}
            <div className="grid gap-4 lg:grid-cols-2">
              <InfoField label="Return ID" value={<span className="font-mono"><CopyField value={returnData.returnNumber} /></span>} />
              <InfoField label="Status" value={getStatusBadge(returnData.status)} />
              <InfoField label={cfg.documentLabel} value={<span className="font-mono text-primary"><CopyField value={returnData.documentRef} /></span>} />
              <InfoField label="Return Date" value={format(new Date(returnData.date), 'dd MMM yyyy hh:mm aa')} />
            </div>

            {/* Counterparty & reason */}
            <div className="grid gap-4 lg:grid-cols-2">
              <InfoField
                label={cfg.counterpartyLabel}
                value={
                  <div className="flex items-center gap-2">
                    <cfg.CounterpartyIcon className="h-4 w-4 text-muted-foreground" />
                    {returnData.counterpartyName ?? cfg.counterpartyFallback}
                  </div>
                }
              />
              <InfoField
                label="Reason"
                value={returnData.reason?.replace(/_/g, ' ')}
                valueClassName="capitalize"
              />
            </div>

            {/* Money summary */}
            <div className="grid gap-4 lg:grid-cols-3">
              {(returnData.deductionAmount ?? 0) > 0 && (
                <InfoField
                  label="Gross Refund"
                  value={formatCurrency(returnData.totalRefundAmount + returnData.deductionAmount!)}
                  valueClassName="text-muted-foreground"
                />
              )}
              {(returnData.deductionAmount ?? 0) > 0 && (
                <InfoField
                  label="Deduction / Fee"
                  value={`-${formatCurrency(returnData.deductionAmount!)}`}
                  valueClassName="text-destructive"
                />
              )}
              <InfoField
                label={(returnData.deductionAmount ?? 0) > 0 ? 'Net Refund' : 'Total Refund'}
                value={`${cfg.totalRefundPrefix}${formatCurrency(returnData.totalRefundAmount)}`}
                valueClassName={cfg.totalRefundColor}
              />
              {/* {returnData.refundedAmount != null && (
                <InfoField
                  label="Cash Refunded"
                  value={formatCurrency(returnData.refundedAmount)}
                  valueClassName={cfg.cashRefundColor}
                />
              )} */}
              {returnData.refundAllocation?.accountRefund && (
                <InfoField
                  label={`Refund (${returnData.refundAllocation.accountRefund.paymentMethod})`}
                  value={formatCurrency(returnData.refundAllocation.accountRefund.amount)}
                />
              )}

              {returnData.refundAllocation?.counterpartyCredit && (
                <InfoField
                  label={cfg.counterpartyCreditLabel}
                  value={formatCurrency(returnData.refundAllocation.counterpartyCredit.amount)}
                />
              )}
              {returnData.refundAllocation?.adjustOtherDues?.length > 0 && <InfoField
                  label="Adjusted dues"
                  value={formatCurrency(returnData.refundAllocation.adjustOtherDues.reduce((sum, d) => sum + d.amount, 0))}
                />}
              {returnData.refundAllocation?.adjustDocumentDue > 0 && <InfoField
                  label="Adjusted document due"
                  value={formatCurrency(returnData.refundAllocation.adjustDocumentDue)}
                />}
              {returnData.totalCostAmount != null && (
                <InfoField label="Cost Amount" value={formatCurrency(returnData.totalCostAmount)} />
              )}
            </div>

            {/* Notes */}
            {returnData.notes && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <ClipboardList className="h-4 w-4" />
                  Notes
                </div>
                <p className="text-sm text-muted-foreground">{returnData.notes}</p>
              </div>
            )}

            {/* Returned items */}
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center gap-2 font-medium">
                <Package className="h-4 w-4" />
                Returned Items ({returnData.items?.length ?? 0})
              </div>

              <Separator />

              {returnData.items?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {returnData.items.map((item, index) => (
                    <div
                      key={`${item.productId}-${index}`}
                      className="rounded-lg bg-muted/30 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-medium text-sm">{item.productName}</div>
                        <Badge variant="outline" className="shrink-0">
                          Qty {item.quantity}
                        </Badge>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {cfg.showSalePrice && item.price != null && (
                          <InfoField label="Sale Price" value={item.price} showCurrency quantity={item.quantity} />
                        )}
                        <InfoField label="Cost Price" value={item.costPrice * item.quantity} showCurrency />
                        {(item.discount ?? 0) > 0 && (
                          <InfoField label="Discount" value={item.discount ?? 0} showCurrency />
                        )}
                        {item.conversionFactor != null && item.conversionFactor > 1 && (
                          <InfoField label="Conv. Factor" value={item.conversionFactor} />
                        )}
                        <InfoField
                          label="Refund"
                          value={`${cfg.totalRefundPrefix}${formatCurrency(item.refundAmount)}`}
                          valueClassName={cfg.refundAmountColor}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Refund Allocation */}
            {returnData.refundAllocation && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <Wallet className="h-4 w-4" />
                  Refund Allocation
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  {(returnData.refundAllocation.adjustDocumentDue ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {cfg.adjustDocumentDueLabel}
                      </span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(returnData.refundAllocation.adjustDocumentDue!)}
                      </span>
                    </div>
                  )}
                  {returnData.refundAllocation.adjustOtherDues?.map((due, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        Adjusted against
                        {due.referenceLabel ? (
                          <CopyableRef value={due.referenceLabel} />
                        ) : (
                          'other due'
                        )}
                      </span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(due.amount)}
                      </span>
                    </div>
                  ))}
                  {returnData.refundAllocation.accountRefund && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Cash refund (
                        {returnData.refundAllocation.accountRefund.paymentMethod})
                      </span>
                      <span className={`font-medium ${cfg.totalRefundColor}`}>
                        {/* {cfg.totalRefundPrefix} */}
                        {formatCurrency(returnData.refundAllocation.accountRefund.amount)}
                      </span>
                    </div>
                  )}
                  {(returnData.refundAllocation.counterpartyCredit?.amount ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{cfg.creditConversionLabel}</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(returnData.refundAllocation.counterpartyCredit!.amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function CopyableRef({ value }: { value: string }) {
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
