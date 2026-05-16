'use client';

import { format } from 'date-fns';
import {
  Package,
  ReceiptText,
  RotateCcw,
  User,
  Hash,
  Wallet,
  ClipboardList,
} from 'lucide-react';
import { Badge } from '@/ui/components/badge';
import { Separator } from '@/ui/components/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/components/sheet';
import { Skeleton } from '@/ui/components/skeleton';
import type { SalesReturn } from '@/types';
import { getStatusBadge } from './columns';

interface ReturnDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesReturn: SalesReturn | null;
  formatCurrency: (n: number) => string;
  isLoading?: boolean;
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 rounded-lg border bg-muted/30 p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="break-words text-sm font-medium">{children}</div>
    </div>
  );
}

export function ReturnDetailsSheet({
  open,
  onOpenChange,
  salesReturn,
  formatCurrency,
  isLoading,
}: ReturnDetailsSheetProps) {
  if (!salesReturn && !isLoading) return null;

  const invoiceNumber =
    typeof salesReturn?.saleId === 'object' && salesReturn?.saleId?.invoiceNumber
      ? salesReturn.saleId.invoiceNumber
      : salesReturn?.invoiceNumber ?? '—';

  const customerName =
    typeof salesReturn?.customerId === 'object' &&
    salesReturn?.customerId !== null &&
    'name' in (salesReturn?.customerId as object)
      ? (salesReturn?.customerId as { name: string }).name
      : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[680px] sm:max-w-[680px] flex flex-col overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Return Details
            {salesReturn?.returnNumber ? ` — ${salesReturn.returnNumber}` : ''}
          </SheetTitle>
          <SheetDescription>
            Full details of this sales return transaction
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-6 space-y-4 px-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : salesReturn ? (
          <div className="mt-6 space-y-6 px-2">
            {/* Header fields */}
            <div className="grid gap-4 lg:grid-cols-2">
              <InfoField label="Return ID">
                <span className="font-mono">{salesReturn.returnNumber}</span>
              </InfoField>
              <InfoField label="Status">
                {getStatusBadge(salesReturn.status)}
              </InfoField>
              <InfoField label="Original Invoice">
                <span className="font-mono text-primary">{invoiceNumber}</span>
              </InfoField>
              <InfoField label="Return Date">
                {format(new Date(salesReturn.createdAt), 'dd MMM yyyy HH:mm')}
              </InfoField>
            </div>

            {/* Customer & reason */}
            <div className="grid gap-4 lg:grid-cols-2">
              <InfoField label="Customer">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {customerName ?? 'Walk-in Customer'}
                </div>
              </InfoField>
              <InfoField label="Reason">
                <span className="capitalize">
                  {salesReturn.reason?.replace(/_/g, ' ')}
                </span>
              </InfoField>
            </div>

            {/* Money summary */}
            <div className="grid gap-4 lg:grid-cols-3">
              <InfoField label="Total Refund">
                <span className="text-red-600">
                  -{formatCurrency(salesReturn.totalRefundAmount ?? 0)}
                </span>
              </InfoField>
              {salesReturn.refundedAmount != null && (
                <InfoField label="Cash Refunded">
                  <span className="text-orange-600">
                    {formatCurrency(salesReturn.refundedAmount)}
                  </span>
                </InfoField>
              )}
              {salesReturn.totalCostAmount != null && (
                <InfoField label="Cost Amount">
                  {formatCurrency(salesReturn.totalCostAmount)}
                </InfoField>
              )}
            </div>

            {/* Notes */}
            {salesReturn.notes && (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2 font-medium text-sm">
                  <ClipboardList className="h-4 w-4" />
                  Notes
                </div>
                <p className="text-sm text-muted-foreground">{salesReturn.notes}</p>
              </div>
            )}

            {/* Returned items */}
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center gap-2 font-medium">
                <Package className="h-4 w-4" />
                Returned Items ({salesReturn.items?.length ?? 0})
              </div>

              <Separator />

              {salesReturn.items?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No items recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {salesReturn.items.map((item, index) => (
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
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                        <div className="space-y-1 rounded border bg-muted/20 p-2">
                          <div className="text-muted-foreground uppercase tracking-wide">
                            Sale Price
                          </div>
                          <div className="font-medium">{formatCurrency(item.price)}</div>
                        </div>
                        {(item.discount ?? 0) > 0 && (
                          <div className="space-y-1 rounded border bg-muted/20 p-2">
                            <div className="text-muted-foreground uppercase tracking-wide">
                              Discount
                            </div>
                            <div className="font-medium">
                              {formatCurrency(item.discount ?? 0)}
                            </div>
                          </div>
                        )}
                        <div className="space-y-1 rounded border bg-muted/20 p-2">
                          <div className="text-muted-foreground uppercase tracking-wide">
                            Cost Price
                          </div>
                          <div className="font-medium">{formatCurrency(item.costPrice)}</div>
                        </div>
                        <div className="space-y-1 rounded border bg-red-50 dark:bg-red-950/30 p-2">
                          <div className="text-muted-foreground uppercase tracking-wide">
                            Refund
                          </div>
                          <div className="font-medium text-red-600">
                            -{formatCurrency(item.refundAmount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Refund Allocation */}
            {salesReturn.refundAllocation && (
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2 font-medium">
                  <Wallet className="h-4 w-4" />
                  Refund Allocation
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  {(salesReturn.refundAllocation.adjustSaleDue ?? 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Adjusted against sale due</span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(salesReturn.refundAllocation.adjustSaleDue!)}
                      </span>
                    </div>
                  )}
                  {salesReturn.refundAllocation.adjustOtherDues?.map((due, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-muted-foreground">
                        Adjusted against other due
                      </span>
                      <span className="font-medium text-blue-600">
                        {formatCurrency(due.amount)}
                      </span>
                    </div>
                  ))}
                  {salesReturn.refundAllocation.accountRefund && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Cash refund ({salesReturn.refundAllocation.accountRefund.paymentMethod})
                      </span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(salesReturn.refundAllocation.accountRefund.amount)}
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
