'use client';
// coding-standard: maintained

import { format } from 'date-fns';
import {
  Boxes,
  CalendarDays,
  ClipboardList,
  Edit3,
  PackageCheck,
  ReceiptText,
  Truck,
  User,
  XCircle,
} from 'lucide-react';
import { Fragment, type ReactNode } from 'react';
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
import type { PurchaseOrder } from '@/types';
import { splitLineTax } from '@/utils/tax';
import { useAuthStore } from '@/services/stores';
import { PrintMenu } from '@/components/shared/print/print-menu';
import { printPurchaseOrder } from '@/utils/print-documents';
import { statusConfig } from '../status-config';

interface OrderDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder | null;
  isLoading: boolean;
  formatCurrency: (n: number) => string;
  onReceiveItems?: (order: PurchaseOrder) => void;
  onCancelOrder?: (order: PurchaseOrder) => void;
  onEditOrder?: (order: PurchaseOrder) => void;
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

export function OrderDetailsDrawer({
  open,
  onOpenChange,
  order,
  isLoading,
  formatCurrency,
  onReceiveItems,
  onCancelOrder,
  onEditOrder,
}: OrderDetailsDrawerProps) {
  const { user } = useAuthStore();
  const canReceive =
    order?.status === 'ordered' || order?.status === 'partial';
  const canCancel =
    order?.status === 'ordered' || order?.status === 'draft';
  const canEdit =
    order?.status === 'ordered' || order?.status === 'draft';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[760px] sm:max-w-[760px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5" />
            Order Details
            {order ? ` — ${order.orderNumber}` : ''}
          </SheetTitle>
          <SheetDescription>
            Full purchase order information and item breakdown
          </SheetDescription>
          {order && (
            <div className="pt-2">
              <PrintMenu
                a4Label="Purchase Order"
                onPrint={(paper) =>
                  printPurchaseOrder(order, {
                    paper,
                    currency: formatCurrency,
                    orgName: user?.organization?.name,
                  })
                }
              />
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="mt-6 space-y-4 px-2">
              <div className="grid gap-3 lg:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : order ? (
            <div className="mt-6 space-y-6 px-2">
              {/* Order Meta */}
              <div className="grid gap-3 lg:grid-cols-2">
                {renderField('Order #', (
                  <span className="font-mono">{order.orderNumber}</span>
                ))}
                {renderField('Status', (
                  <Badge
                    variant={statusConfig[order.status].variant}
                    className="flex gap-1 w-fit"
                  >
                    {statusConfig[order.status].icon}
                    {statusConfig[order.status].label}
                  </Badge>
                ))}
                {renderField('Supplier', (
                  <div className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>{order.supplierId?.name ?? '—'}</span>
                  </div>
                ))}
                {order.supplierId?.address && renderField('Supplier Address', order.supplierId.address)}
                {renderField('Created At', (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {format(new Date(order.createdAt), 'dd MMM yyyy hh:mm aa')}
                  </div>
                ))}
                {renderField('Updated At', (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {format(new Date(order.updatedAt), 'dd MMM yyyy hh:mm aa')}
                  </div>
                ))}
                {order.invoiceNumber && renderField('Supplier Invoice', order.invoiceNumber)}
                {order.invoiceDate && renderField('Invoice Date', format(new Date(order.invoiceDate), 'dd MMM yyyy'))}
                {order.createdBy && renderField('Created By', (
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {typeof order.createdBy === 'string'
                      ? order.createdBy
                      : order.createdBy.email
                        ?? (order.createdBy.firstName
                          ? `${order.createdBy.firstName}${order.createdBy.lastName ? ` ${order.createdBy.lastName}` : ''}`
                          : '—')}
                  </div>
                ))}
              </div>

              {/* Financial Summary */}
              <div className="grid gap-3 lg:grid-cols-3">
                {renderField('Subtotal', formatCurrency(order.subtotal))}
                {renderField('Additional Discount', formatCurrency(order.additionalDiscount ?? 0))}
                {(() => {
                  // Split line tax into added (exclusive) vs in-price (inclusive).
                  const { addedTax, includedTax } = splitLineTax(order.items ?? []);
                  if (addedTax <= 0 && includedTax <= 0) {
                    return (order.taxTotal ?? 0) > 0
                      ? renderField('Tax', formatCurrency(order.taxTotal ?? 0))
                      : null;
                  }
                  return (
                    <>
                      {addedTax > 0 && (
                        <Fragment key="tax-added">{renderField('Tax (added)', formatCurrency(addedTax))}</Fragment>
                      )}
                      {includedTax > 0 && (
                        <Fragment key="tax-incl">{renderField('Tax (in price)', formatCurrency(includedTax))}</Fragment>
                      )}
                    </>
                  );
                })()}
                {renderField('Invoice Amount', formatCurrency(
                  order.invoiceAmount ?? order.grandTotal ?? order.totalAmount ?? order.subtotal ?? 0,
                ))}
                {renderField('Paid Amount', (
                  <span className="text-green-600">
                    {formatCurrency(order.paidAmount ?? 0)}
                  </span>
                ))}
                {renderField('Due Amount', (
                  <span className={(order.dueAmount ?? 0) > 0 ? 'text-red-600' : 'text-green-600'}>
                    {formatCurrency(order.dueAmount ?? 0)}
                  </span>
                ))}
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
                  {order.items.map((item, index) => {
                    const totalUnits = item.quantity * (item.conversionFactor ?? 1);
                    const purchaseUnitName = item.purchaseUnitName;

                    return (
                      <div
                        key={`${item.productId}-${item.variantId ?? 'no-variant'}-${index}`}
                        className="space-y-3 rounded-lg bg-muted/30 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">
                              {item.productName ?? item.product?.name ?? 'Unknown'}
                            </div>
                            {item.variantName && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {item.variantName}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {item.receivedQuantity > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                Received: {item.receivedQuantity}
                              </Badge>
                            )}
                            <Badge variant="outline">
                              Qty {item.quantity}
                              {purchaseUnitName ? ` ${purchaseUnitName}` : ''}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {renderField('Unit Price', formatCurrency(item.price))}
                          {renderField(
                            'Conversion',
                            item.conversionFactor && item.conversionFactor > 1
                              ? `${item.quantity} × ${item.conversionFactor} = ${totalUnits} units`
                              : `${totalUnits} unit${totalUnits !== 1 ? 's' : ''}`,
                          )}
                          {renderField('Cost Price / Unit', formatCurrency(item.costPrice ?? 0))}
                          {renderField('Subtotal', formatCurrency(item.subtotal))}
                          {item.taxRate
                            ? renderField(
                                `Tax (${item.taxRate}%)${item.taxType === 'inclusive' ? ' incl.' : ''}`,
                                formatCurrency(item.taxAmount ?? 0),
                              )
                            : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                <div className="flex items-center justify-between px-1">
                  <span className="text-sm text-muted-foreground">
                    {order.items.length} product(s) ·{' '}
                    {order.items.reduce(
                      (s, i) => s + i.quantity * (i.conversionFactor ?? 1),
                      0,
                    )}{' '}
                    total units
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(
                      order.invoiceAmount ??
                        order.grandTotal ??
                        order.totalAmount ??
                        order.subtotal ??
                        0,
                    )}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {(canReceive || canCancel || canEdit) && (
                <div className="flex flex-wrap gap-2 pb-4">
                  {canReceive && onReceiveItems && (
                    <Button
                      className="flex-1 min-w-[160px]"
                      onClick={() => {
                        onReceiveItems(order);
                      }}
                    >
                      <PackageCheck className="h-4 w-4 mr-2" />
                      Receive Items
                    </Button>
                  )}
                  {canEdit && onEditOrder && (
                    <Button
                      variant="outline"
                      className="flex-1 min-w-[160px]"
                      onClick={() => onEditOrder(order)}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Order
                    </Button>
                  )}
                  {canCancel && onCancelOrder && (
                    <Button
                      variant="destructive"
                      className="flex-1 min-w-[160px]"
                      onClick={() => onCancelOrder(order)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
