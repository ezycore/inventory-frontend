'use client';
// coding-standard: maintained

import { format as formatDate } from 'date-fns';
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
  const { format: fmt } = useCurrency();
  const refunded = purchaseReturns.reduce(
    (sum, ret) => sum + (ret.totalRefundAmount ?? 0),
    0,
  );
  const due = order.dueAmount ?? 0;

  return (
    <StatStrip>
      <StatTile label="Invoice total" value={fmt(order.invoiceAmount ?? 0)} />
      <StatTile
        label="Paid"
        value={fmt(order.paidAmount ?? 0)}
        valueClassName="text-green-600"
      />
      <StatTile
        label="Due"
        value={fmt(due)}
        valueClassName={due > 0 ? 'text-red-600' : 'text-green-600'}
      />
      {refunded > 0 && (
        <StatTile
          label="Refunded"
          value={fmt(refunded)}
          valueClassName="text-red-600"
          sub={`${purchaseReturns.length} return${purchaseReturns.length === 1 ? '' : 's'}`}
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
): string {
  const parts: string[] = [];
  if (item.variantName) parts.push(item.variantName);
  if (variant === 'order') {
    if (canViewCosts && item.costPrice != null) {
      parts.push(`Cost ${fmt(item.costPrice)}/unit`);
    }
    if ((item.receivedQuantity ?? 0) > 0) parts.push(`Received ${item.receivedQuantity}`);
  } else {
    if (canViewCosts && item.costPrice != null) {
      parts.push(
        `Cost ${fmt(item.costPrice)} × ${item.quantity} = ${fmt(item.costPrice * item.quantity)}`,
      );
      // The discount figure is derived from cost, so it shares the gate.
      const discount = (item.price - item.costPrice) * item.quantity;
      if (discount > 0) parts.push(`Disc ${fmt(discount)}`);
    }
    parts.push(`Received ${item.receivedQuantity ?? 0}/${item.quantity}`);
  }
  return parts.join(' · ');
}

export function PurchaseItemsTable({
  order,
  totalLabel = 'Invoice total',
  documentTotal,
  variant = 'history',
}: {
  order: PurchaseOrder;
  totalLabel?: string;
  /** Override for the grand-total figure (defaults to the invoice amount). */
  documentTotal?: number;
  variant?: ItemsVariant;
}) {
  const { format: fmt } = useCurrency();
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);
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
      header: 'Item',
      cell: (item) => (
        <ItemCell
          name={item.productName || item.product?.name || 'Product'}
          sub={itemSubline(item, fmt, variant, canViewCosts)}
        />
      ),
    },
    {
      key: 'qty',
      header: 'Qty',
      align: 'right',
      cell: (item) =>
        `${item.quantity}${item.purchaseUnitName ? ` ${item.purchaseUnitName}` : ''}`,
    },
    {
      key: 'units',
      header: 'Units',
      align: 'right',
      cell: (item) =>
        item.conversionFactor && item.conversionFactor > 1
          ? `×${item.conversionFactor} = ${item.quantity * item.conversionFactor}`
          : item.quantity,
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      cell: (item) => fmt(item.price),
    },
    {
      key: 'tax',
      header: 'Tax',
      align: 'right',
      cell: (item) =>
        item.taxRate
          ? `${item.taxRate}%${item.taxType === 'inclusive' ? ' incl.' : ''} · ${fmt(item.taxAmount ?? 0)}`
          : '—',
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      cellClassName: 'font-semibold',
      cell: (item) => fmt(item.subtotal ?? item.price * item.quantity),
    },
  ];

  const totalsRows: TotalsRow[] = [
    { label: 'Subtotal', value: fmt(order.subtotal) },
    {
      label: 'Additional discount',
      value:
        (order.additionalDiscount ?? 0) > 0
          ? `−${fmt(order.additionalDiscount!)}`
          : fmt(0),
    },
    ...(hasLineTax
      ? [
          ...(addedTax > 0 ? [{ label: 'Tax (added)', value: fmt(addedTax) }] : []),
          ...(includedTax > 0
            ? [{ label: 'Tax (in price)', value: fmt(includedTax), muted: true }]
            : []),
        ]
      : (order.taxTotal ?? 0) > 0
        ? [{ label: 'Tax', value: fmt(order.taxTotal!) }]
        : []),
  ];

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">
        Items{' '}
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
        meta={`${order.items.length} product${order.items.length === 1 ? '' : 's'} · ${totalUnits} unit${totalUnits === 1 ? '' : 's'}`}
        rows={totalsRows}
        total={{
          label: totalLabel,
          value: fmt(documentTotal ?? order.invoiceAmount ?? 0),
        }}
      />
    </div>
  );
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export function PurchaseDetailsKv({ order }: { order: PurchaseOrder }) {
  return (
    <DetailsKv
      rows={[
        {
          label: 'Supplier',
          value: order.supplierId?.name ?? order.supplier?.name ?? 'Unknown Supplier',
        },
        { label: 'Created by', value: getCreatedByName(order) },
        {
          label: 'Created at',
          value: formatDate(new Date(order.createdAt), 'dd MMM yyyy hh:mm aa'),
        },
        {
          label: 'Updated at',
          value: formatDate(new Date(order.updatedAt), 'dd MMM yyyy hh:mm aa'),
        },
      ]}
    />
  );
}
