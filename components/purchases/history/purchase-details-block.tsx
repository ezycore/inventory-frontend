'use client';
// coding-standard: maintained

import { formatInTimeZone } from 'date-fns-tz';
import { getOrgTimezone } from '@/hooks/use-org-calendar';
import { useTranslations } from 'next-intl';
import type { Translator } from '@/i18n/config';
import { SimpleTable, type SimpleColumn } from '@/ui/components/simple-table';
import {
  DetailsKv,
  ItemCell,
  StatStrip,
  StatTile,
  TotalsBlock,
  type TotalsRow,
  detailTableClass,
} from '@/components/shared/detail-sheet';
import { useCurrency } from '@/lib/currency';
import { PERMISSIONS, useHasPermission } from '@/hooks/use-has-permission';
import type { PurchaseOrder, PurchaseReturn } from '@/types';
import { populatedRef } from '@/utils/populated-ref';
import { splitLineTax } from '@/utils/tax';

export function getCreatedByName(order: PurchaseOrder): string {
  const cb = order.createdBy;
  if (typeof cb === 'string') return cb;
  if (cb && typeof cb === 'object') {
    const name = [cb.firstName, cb.lastName].filter(Boolean).join(' ').trim();
    if (name) return name;
    if (cb.email) return cb.email;
  }
  return '-';
}

// ── Headline stats ───────────────────────────────────────────────────────────

export function PurchaseStats({
  order,
  purchaseReturns,
}: {
  order: PurchaseOrder;
  purchaseReturns: PurchaseReturn[];
}) {
  const t = useTranslations('purchases.history');
  const { format: fmt } = useCurrency();
  const refunded = purchaseReturns.reduce(
    (sum, ret) => sum + (ret.totalRefundAmount ?? 0),
    0,
  );
  const due = order.dueAmount ?? 0;

  return (
    <StatStrip>
      <StatTile label={t('statInvoiceTotal')} value={fmt(order.invoiceAmount ?? 0)} />
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
      {refunded > 0 && (
        <StatTile
          label={t('statRefunded')}
          value={fmt(refunded)}
          valueClassName="text-red-600"
          sub={t('returnCount', { count: purchaseReturns.length })}
        />
      )}
    </StatStrip>
  );
}

// ── Items table ──────────────────────────────────────────────────────────────

type PurchaseItem = PurchaseOrder['items'][number];

/** In the history view costPrice is per purchase unit; in the order view it's per base unit. */
type ItemsVariant = 'history' | 'order';

function itemSubline(
  item: PurchaseItem,
  fmt: (n: number) => string,
  variant: ItemsVariant,
  canViewCosts: boolean,
  /** Bound to the `purchases.history` namespace. */
  t: Translator,
): string {
  const parts: string[] = [];
  if (variant === 'order') {
    if (canViewCosts && item.costPrice != null) {
      parts.push(t('costPerUnit', { amount: fmt(item.costPrice) }));
    }
    if ((item.receivedQuantity ?? 0) > 0) parts.push(t('receivedCount', { count: item.receivedQuantity }));
  } else {
    if (canViewCosts && item.costPrice != null) {
      parts.push(
        t('costTimes', {
          price: fmt(item.costPrice),
          qty: item.quantity,
          total: fmt(item.costPrice * item.quantity),
        }),
      );
      // The discount figure is derived from cost, so it shares the gate.
      const discount = (item.price - item.costPrice) * item.quantity;
      if (discount > 0) parts.push(t('discAmount', { amount: fmt(discount) }));
    }
    parts.push(t('receivedOf', { received: item.receivedQuantity ?? 0, qty: item.quantity }));
  }
  return parts.join(' · ');
}

export function PurchaseItemsTable({
  order,
  totalLabel,
  documentTotal,
  variant = 'history',
}: {
  order: PurchaseOrder;
  totalLabel?: string;
  /** Override for the grand-total figure (defaults to the invoice amount). */
  documentTotal?: number;
  variant?: ItemsVariant;
}) {
  const t = useTranslations('purchases.history');
  const { format: fmt } = useCurrency();
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);
  const resolvedTotalLabel = totalLabel ?? t('invoiceTotalLabel');
  // Added (exclusive) vs in-price (inclusive, informational) tax of the order.
  const { addedTax, includedTax } = splitLineTax(order.items);
  const hasLineTax = addedTax > 0 || includedTax > 0;
  const totalUnits = order.items.reduce(
    (sum, item) => sum + item.quantity * (item.conversionFactor ?? 1),
    0,
  );

  const columns: SimpleColumn<PurchaseItem>[] = [
    {
      key: 'item',
      header: t('colItem'),
      cell: (item) => (
        <ItemCell
          name={item.productName || t('itemsHeader')}
          sub={itemSubline(item, fmt, variant, canViewCosts, t)}
        />
      ),
    },
    {
      key: 'qty',
      header: t('colQty'),
      align: 'right',
      cell: (item) =>
        `${item.quantity}${item.purchaseUnitName ? ` ${item.purchaseUnitName}` : ''}`,
    },
    {
      key: 'units',
      header: t('colUnits'),
      align: 'right',
      cell: (item) =>
        item.conversionFactor && item.conversionFactor > 1
          ? `×${item.conversionFactor} = ${item.quantity * item.conversionFactor}`
          : item.quantity,
    },
    {
      key: 'price',
      header: t('colPrice'),
      align: 'right',
      cell: (item) => fmt(item.price),
    },
    {
      key: 'tax',
      header: t('colTax'),
      align: 'right',
      cell: (item) =>
        item.taxRate
          ? item.taxType === 'inclusive'
            ? t('taxCellIncl', { rate: item.taxRate, amount: fmt(item.taxAmount ?? 0) })
            : t('taxCell', { rate: item.taxRate, amount: fmt(item.taxAmount ?? 0) })
          : '—',
    },
    {
      key: 'total',
      header: t('colLineTotal'),
      align: 'right',
      cellClassName: 'font-semibold',
      cell: (item) => fmt(item.subtotal ?? item.price * item.quantity),
    },
  ];

  const totalsRows: TotalsRow[] = [
    { label: t('subtotal'), value: fmt(order.subtotal) },
    {
      label: t('additionalDiscount'),
      value:
        (order.additionalDiscount ?? 0) > 0
          ? `−${fmt(order.additionalDiscount!)}`
          : fmt(0),
    },
    ...(hasLineTax
      ? [
          ...(addedTax > 0 ? [{ label: t('taxAdded'), value: fmt(addedTax) }] : []),
          ...(includedTax > 0
            ? [{ label: t('taxInPrice'), value: fmt(includedTax), muted: true }]
            : []),
        ]
      : (order.taxTotal ?? 0) > 0
        ? [{ label: t('tax'), value: fmt(order.taxTotal!) }]
        : []),
  ];

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">
        {t('itemsHeader')}{' '}
        <span className="font-normal text-muted-foreground">({order.items.length})</span>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <SimpleTable
          className={detailTableClass}
          columns={columns}
          rows={order.items}
          getRowKey={(item, index) => `${item.productId}-${index}`}
        />
      </div>
      <TotalsBlock
        meta={t('productUnitMeta', { products: order.items.length, units: totalUnits })}
        rows={totalsRows}
        total={{
          label: resolvedTotalLabel,
          value: fmt(documentTotal ?? order.invoiceAmount ?? 0),
        }}
      />
    </div>
  );
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export function PurchaseDetailsKv({ order }: { order: PurchaseOrder }) {
  const t = useTranslations('purchases.history');
  return (
    <DetailsKv
      rows={[
        {
          label: t('kvSupplier'),
          value: populatedRef(order.supplierId)?.name ?? t('unknownSupplier'),
        },
        { label: t('kvCreatedBy'), value: getCreatedByName(order) },
        {
          label: t('kvCreatedAt'),
          value: formatInTimeZone(new Date(order.createdAt), getOrgTimezone(), 'dd MMM yyyy hh:mm aa'),
        },
        {
          label: t('kvUpdatedAt'),
          value: formatInTimeZone(new Date(order.updatedAt), getOrgTimezone(), 'dd MMM yyyy hh:mm aa'),
        },
      ]}
    />
  );
}
