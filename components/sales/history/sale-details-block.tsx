'use client';
// coding-standard: maintained

import { useTranslations } from 'next-intl';
import { format as formatDate } from 'date-fns';
import { SimpleTable, type SimpleColumn } from '@/ui/components/simple-table';
import {
  ComboBadge,
  DetailsKv,
  ItemCell,
  StatStrip,
  StatTile,
  TotalsBlock,
  type TotalsRow,
  comboRowClass,
  detailTableClass,
} from '@/components/shared/detail-sheet';
import { useCurrency } from '@/lib/currency';
import { PERMISSIONS, useHasPermission } from '@/hooks/use-has-permission';
import type { Sale, SaleItem, SalesReturn } from '@/types';
import { splitLineTax } from '@/utils/tax';
import { groupSaleItemsByCombo } from '@/components/sales/helpers';

// ── Headline stats ───────────────────────────────────────────────────────────

export function SaleStats({
  sale,
  saleReturns,
}: {
  sale: Sale;
  saleReturns?: SalesReturn[];
}) {
  const t = useTranslations('sales.history.details');
  const { format: fmt } = useCurrency();
  const refunded = (saleReturns ?? []).reduce(
    (sum, r) => sum + (r.totalRefundAmount ?? 0),
    0,
  );
  // Drafts carry no payment state — only the total is meaningful.
  const isDraft = sale.status === 'draft';

  return (
    <StatStrip>
      <StatTile label={t('invoiceTotal')} value={fmt(sale.totalAmount)} />
      {!isDraft && (
        <StatTile
          label={t('paid')}
          value={fmt(sale.paidAmount)}
          valueClassName="text-green-600"
        />
      )}
      {!isDraft && (
        <StatTile
          label={t('due')}
          value={fmt(sale.dueAmount)}
          valueClassName={sale.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}
        />
      )}
      {refunded > 0 && (
        <StatTile
          label={t('refunded')}
          value={fmt(refunded)}
          valueClassName="text-red-600"
          sub={`${saleReturns!.length} return${saleReturns!.length === 1 ? '' : 's'}`}
        />
      )}
    </StatStrip>
  );
}

// ── Items table ──────────────────────────────────────────────────────────────

type SaleItemRow =
  | { kind: 'combo'; key: string; name: string; total: number }
  | { kind: 'item'; key: string; item: SaleItem; inCombo: boolean };

function buildItemRows(items: SaleItem[], comboLabel: string): SaleItemRow[] {
  const rows: SaleItemRow[] = [];
  for (const group of groupSaleItemsByCombo(items)) {
    if (group.comboLineId) {
      rows.push({
        kind: 'combo',
        key: group.key,
        name: group.comboName ?? comboLabel,
        total: group.comboSubtotal,
      });
      group.items.forEach((item, i) =>
        rows.push({
          kind: 'item',
          key: `${group.key}-${item.productId}-${i}`,
          item,
          inCombo: true,
        }),
      );
    } else {
      rows.push({ kind: 'item', key: group.key, item: group.items[0], inCombo: false });
    }
  }
  return rows;
}

export function SaleItemsTable({ sale }: { sale: Sale }) {
  const t = useTranslations('sales.history.details');
  const { format: fmt } = useCurrency();
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);
  const rows = buildItemRows(sale.items, t('combo'));
  // Added (exclusive) vs in-price (inclusive, informational) tax of the sale.
  const { addedTax, includedTax } = splitLineTax(sale.items);
  const totalUnits = sale.items.reduce((sum, item) => sum + item.quantity, 0);

  const columns: SimpleColumn<SaleItemRow>[] = [
    {
      key: 'item',
      header: t('item'),
      cell: (row) =>
        row.kind === 'combo' ? (
          <span className="flex items-center gap-2 font-medium">
            {row.name}
            <ComboBadge />
          </span>
        ) : (
          <ItemCell
            name={row.item.productName}
            indent={row.inCombo}
            sub={
              canViewCosts
                ? `Cost ${fmt(row.item.costPrice)} × ${row.item.quantity} = ${fmt(row.item.costPrice * row.item.quantity)}`
                : undefined
            }
          />
        ),
    },
    {
      key: 'qty',
      header: t('qty'),
      align: 'right',
      cell: (row) => (row.kind === 'item' ? row.item.quantity : null),
    },
    {
      key: 'price',
      header: t('price'),
      align: 'right',
      cell: (row) => (row.kind === 'item' ? fmt(row.item.price) : null),
    },
    {
      key: 'discount',
      header: t('disc'),
      align: 'right',
      cell: (row) =>
        row.kind === 'item'
          ? row.item.discount > 0
            ? `−${fmt(row.item.discount * row.item.quantity)}`
            : '—'
          : null,
    },
    {
      key: 'tax',
      header: t('tax'),
      align: 'right',
      cell: (row) =>
        row.kind === 'item'
          ? row.item.taxRate
            ? `${row.item.taxRate}%${row.item.taxType === 'inclusive' ? ' incl.' : ''} · ${fmt(row.item.taxAmount ?? 0)}`
            : '—'
          : null,
    },
    {
      key: 'total',
      header: t('total'),
      align: 'right',
      cellClassName: 'font-semibold',
      cell: (row) => (row.kind === 'combo' ? fmt(row.total) : fmt(row.item.subtotal)),
    },
  ];

  const totalsRows: TotalsRow[] = [
    { label: t('subtotal'), value: fmt(sale.subtotal) },
    {
      label: t('additionalDiscount'),
      value: sale.additionalDiscount > 0 ? `−${fmt(sale.additionalDiscount)}` : fmt(0),
    },
    ...(addedTax > 0 ? [{ label: t('taxAdded'), value: fmt(addedTax) }] : []),
    ...(includedTax > 0
      ? [{ label: t('taxInPrice'), value: fmt(includedTax), muted: true }]
      : []),
  ];

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">
        {t('itemsHeading')}{' '}
        <span className="font-normal text-muted-foreground">({sale.items.length})</span>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <SimpleTable
          className={detailTableClass}
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.key}
          rowClassName={(row) => (row.kind === 'combo' ? comboRowClass : undefined)}
        />
      </div>
      <TotalsBlock
        meta={t('meta', { products: sale.items.length, units: totalUnits })}
        rows={totalsRows}
        total={{ label: t('invoiceTotal'), value: fmt(sale.totalAmount) }}
      />
    </div>
  );
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export function SaleDetailsKv({ sale }: { sale: Sale }) {
  const t = useTranslations('sales.history.details');
  const tHistory = useTranslations('sales.history');
  const { format: fmt } = useCurrency();
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);

  return (
    <DetailsKv
      rows={[
        { label: t('customer'), value: sale.customerId?.name ?? tHistory('walkInCustomer') },
        {
          label: t('createdBy'),
          value: sale.createdBy
            ? `${sale.createdBy.firstName} ${sale.createdBy.lastName}`
            : '-',
        },
        {
          label: t('createdAt'),
          value: formatDate(new Date(sale.createdAt), 'dd MMM yyyy hh:mm aa'),
        },
        {
          label: t('updatedAt'),
          value: formatDate(new Date(sale.updatedAt), 'dd MMM yyyy hh:mm aa'),
        },
        {
          label: t('costPrice'),
          value:
            canViewCosts && sale.costPrice != null ? fmt(sale.costPrice) : undefined,
          muted: true,
        },
      ]}
    />
  );
}
