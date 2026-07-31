'use client';
// coding-standard: maintained

import { format as formatDate } from 'date-fns';
import { populatedRef } from '@/utils/populated-ref';
import { useLocale, useTranslations } from 'next-intl';
import { Edit3, PackageCheck, ReceiptText, XCircle } from 'lucide-react';
import type { AppLocale } from '@/i18n/config';
import { Badge } from '@/ui/components/badge';
import { Button } from '@/ui/components/button';
import { CopyField } from '@/ui/components/copy';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/components/sheet';
import { Skeleton } from '@/ui/components/skeleton';
import type { PurchaseOrder } from '@/types';
import { useAuthStore } from '@/services/stores';
import { PrintMenu } from '@/components/shared/print/print-menu';
import { SheetHeaderBar } from '@/components/shared/print/sheet-header-bar';
import {
  DetailsKv,
  NoteCallout,
  StatStrip,
  StatTile,
} from '@/components/shared/detail-sheet';
import { useCurrency } from '@/lib/currency';
import {
  orgToPrintHeader,
  printPurchaseOrder,
  resolveDefaultPaper,
} from '@/utils/print-documents';
import { statusConfig } from '../status-config';
import {
  PurchaseItemsTable,
  getCreatedByName,
} from '../history/purchase-details-block';

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

function OrderStats({ order }: { order: PurchaseOrder }) {
  const t = useTranslations('purchases.orders');
  const tStatus = useTranslations('purchases.status');
  const { format: fmt } = useCurrency();
  const orderTotal =
    order.invoiceAmount ?? order.totalAmount ?? order.subtotal ?? 0;
  const due = order.dueAmount ?? 0;
  const orderedQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const receivedQty = order.items.reduce(
    (sum, item) => sum + (item.receivedQuantity ?? 0),
    0,
  );

  return (
    <StatStrip>
      <StatTile label={t('statOrderTotal')} value={fmt(orderTotal)} />
      <StatTile
        label={t('statPaid')}
        value={fmt(order.paidAmount ?? 0)}
        valueClassName="text-green-600"
      />
      <StatTile
        label={t('statDue')}
        value={fmt(due)}
        valueClassName={due > 0 ? 'text-red-600' : 'text-green-600'}
      />
      <StatTile
        label={t('statReceived')}
        value={`${receivedQty} / ${orderedQty}`}
        sub={t('ofOrderedQty')}
      />
    </StatStrip>
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
  const t = useTranslations('purchases.orders');
  const tStatus = useTranslations('purchases.status');
  const tPrintDoc = useTranslations('common.printDoc');
  const locale = useLocale() as AppLocale;
  const { user } = useAuthStore();
  const canReceive = order?.status === 'ordered' || order?.status === 'partial';
  const canCancel = order?.status === 'ordered' || order?.status === 'draft';
  const canEdit = order?.status === 'ordered' || order?.status === 'draft';
  const status = order ? statusConfig[order.status] : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-[760px]">
        <SheetHeader>
          <SheetHeaderBar
            action={
              order && (
                <PrintMenu
                  appearance="solid"
                  a4Label={t('printA4Label')}
                  defaultPaper={resolveDefaultPaper(user?.organization)}
                  onPrint={(paper) =>
                    printPurchaseOrder(order, {
                      paper,
                      currency: formatCurrency,
                      header: orgToPrintHeader(user?.organization),
                      t: tPrintDoc,
                      locale,
                    })
                  }
                />
              )
            }
          >
            <SheetTitle className="flex flex-wrap items-center gap-2">
              <ReceiptText className="h-5 w-5" />
              {t('drawerTitle')}
              {order ? ` — ${order.orderNumber}` : ''}
              {order && <CopyField value={order.orderNumber} showValue={false} />}
              {order && (
                <Badge variant={status?.variant ?? 'outline'} className="flex w-fit gap-1">
                  {status?.icon}
                  {order.status ? tStatus(order.status) : order.status}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription>
              {t('drawerDescription')}
            </SheetDescription>
          </SheetHeaderBar>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="mt-2 space-y-4 px-4 pb-6">
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 flex-1" />
                ))}
              </div>
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : order ? (
            <div className="mt-2 space-y-6 px-4 pb-6">
              <OrderStats order={order} />

              <PurchaseItemsTable
                order={order}
                variant="order"
                totalLabel={t('statOrderTotal')}
                documentTotal={
                  order.invoiceAmount ??
                  order.totalAmount ??
                  order.subtotal ??
                  0
                }
              />

              {order.notes && <NoteCallout>{order.notes}</NoteCallout>}

              <DetailsKv
                rows={[
                  { label: t('kvSupplier'), value: populatedRef(order.supplierId)?.name ?? '—' },
                  { label: t('kvSupplierAddress'), value: populatedRef(order.supplierId)?.address },
                  { label: t('kvSupplierInvoice'), value: order.invoiceNumber },
                  {
                    label: t('kvInvoiceDate'),
                    value: order.invoiceDate
                      ? formatDate(new Date(order.invoiceDate), 'dd MMM yyyy')
                      : undefined,
                  },
                  {
                    label: t('kvCreatedBy'),
                    value: order.createdBy ? getCreatedByName(order) : undefined,
                  },
                  {
                    label: t('kvCreatedAt'),
                    value: formatDate(new Date(order.createdAt), 'dd MMM yyyy hh:mm aa'),
                  },
                  {
                    label: t('kvUpdatedAt'),
                    value: formatDate(new Date(order.updatedAt), 'dd MMM yyyy hh:mm aa'),
                  },
                ]}
              />
            </div>
          ) : null}
        </div>

        {order && (canReceive || canCancel || canEdit) && (
          <div className="flex flex-wrap gap-2 border-t px-4 py-3">
            {canReceive && onReceiveItems && (
              <Button
                className="min-w-[160px] flex-1"
                onClick={() => {
                  onReceiveItems(order);
                }}
              >
                <PackageCheck className="mr-2 h-4 w-4" />
                {t('receiveItems')}
              </Button>
            )}
            {canEdit && onEditOrder && (
              <Button
                variant="outline"
                className="min-w-[160px] flex-1"
                onClick={() => onEditOrder(order)}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                {t('editOrder')}
              </Button>
            )}
            {canCancel && onCancelOrder && (
              <Button
                variant="destructive"
                className="min-w-[160px] flex-1"
                onClick={() => onCancelOrder(order)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {t('cancelOrder')}
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
