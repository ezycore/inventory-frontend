'use client';
// coding-standard: maintained

import { useLocale, useTranslations } from 'next-intl';
import { format as formatDate } from 'date-fns';
import { RotateCcw } from 'lucide-react';
import type { AppLocale } from '@/i18n/config';
import { Badge } from '@/ui/components/badge';
import { CopyField } from '@/ui/components/copy';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/ui/components/sheet';
import { Skeleton } from '@/ui/components/skeleton';
import { SimpleTable, type SimpleColumn } from '@/ui/components/simple-table';
import {
  ComboBadge,
  DetailsKv,
  ItemCell,
  NoteCallout,
  StatStrip,
  StatTile,
  comboRowClass,
  detailTableClass,
} from '@/components/shared/detail-sheet';
import { splitLineTax } from '@/utils/tax';
import { PERMISSIONS, useHasPermission } from '@/hooks/use-has-permission';
import { groupSaleItemsByCombo } from '@/components/sales/helpers';
import { useAuthStore } from '@/services/stores';
import { PrintMenu } from '@/components/shared/print/print-menu';
import { SheetHeaderBar } from '@/components/shared/print/sheet-header-bar';
import {
  orgToPrintHeader,
  printReturn,
  resolveDefaultPaper,
} from '@/utils/print-documents';

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
  /** Tax snapshot (proportional reversal of the original line; backend-set). */
  taxRate?: number;
  taxType?: 'inclusive' | 'exclusive';
  taxAmount?: number;
  /** Combo provenance (sales returns) — group by comboLineId under a combo header. */
  comboLineId?: string;
  comboName?: string;
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

function getStatusBadge(status: string, t: (key: string) => string) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="border-0 bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400">
          {t('processed')}
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="border-0 bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400">
          {t('pending')}
        </Badge>
      );
    case 'cancelled':
      return <Badge variant="destructive">{t('cancelled')}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ── Variant config ───────────────────────────────────────────────────────────

const VARIANT_CONFIG = {
  sales: {
    counterpartyLabel: 'customer',
    counterpartyFallback: 'walkInCustomer',
    documentLabel: 'originalInvoice',
    sheetDescription: 'salesSheetDescription',
    totalRefundColor: 'text-red-600',
    totalRefundPrefix: '-',
    adjustDocumentDueLabel: 'adjustedSaleDue',
    creditConversionLabel: 'convertedStoreCredit',
    refundAmountColor: 'text-red-600',
    printLabel: 'salesReturn',
    showSalePrice: true,
  },
  purchases: {
    counterpartyLabel: 'supplier',
    counterpartyFallback: 'unknownSupplier',
    documentLabel: 'originalOrder',
    sheetDescription: 'purchaseSheetDescription',
    totalRefundColor: 'text-orange-600',
    totalRefundPrefix: '',
    adjustDocumentDueLabel: 'adjustedSupplierDue',
    creditConversionLabel: 'adjustedSupplierCredit',
    refundAmountColor: 'text-orange-600',
    printLabel: 'purchaseReturn',
    showSalePrice: false,
  },
} as const;

type VariantConfig = (typeof VARIANT_CONFIG)[keyof typeof VARIANT_CONFIG];

// ── Headline stats ───────────────────────────────────────────────────────────

function ReturnStats({
  returnData,
  cfg,
  formatCurrency,
  t,
}: {
  returnData: ReturnDetailsData;
  cfg: VariantConfig;
  formatCurrency: (n: number) => string;
  t: (key: string) => string;
}) {
  const deduction = returnData.deductionAmount ?? 0;
  // Added (exclusive, real money) vs in-price (inclusive, informational) tax of the
  // refund — same split the order detail views use. Tax-off returns carry 0 (no rows).
  const { addedTax, includedTax } = splitLineTax(returnData.items);

  return (
    <StatStrip>
      <StatTile
        label={deduction > 0 ? t('netRefundLabel') : t('totalRefundLabel')}
        value={`${cfg.totalRefundPrefix}${formatCurrency(returnData.totalRefundAmount)}`}
        valueClassName={cfg.totalRefundColor}
      />
      {deduction > 0 && (
        <StatTile
          label={t('grossRefundLabel')}
          value={formatCurrency(returnData.totalRefundAmount + deduction)}
          valueClassName="text-muted-foreground"
        />
      )}
      {deduction > 0 && (
        <StatTile
          label={t('deductionFeeLabel')}
          value={`-${formatCurrency(deduction)}`}
          valueClassName="text-destructive"
        />
      )}
      {addedTax > 0 && (
        <StatTile
          label={t('taxAddedLabel')}
          value={formatCurrency(addedTax)}
          valueClassName="text-muted-foreground"
        />
      )}
      {includedTax > 0 && (
        <StatTile
          label={t('taxInPriceLabel')}
          value={formatCurrency(includedTax)}
          valueClassName="text-muted-foreground"
        />
      )}
    </StatStrip>
  );
}

// ── Refund allocation ────────────────────────────────────────────────────────

function RefundAllocationPanel({
  allocation,
  cfg,
  formatCurrency,
  t,
}: {
  allocation: NonNullable<ReturnDetailsData['refundAllocation']>;
  cfg: VariantConfig;
  formatCurrency: (n: number) => string;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{t('whereRefundWent')}</div>
      <div className="space-y-1 rounded-lg border px-3.5 py-3 text-sm">
        {(allocation.adjustDocumentDue ?? 0) > 0 && (
          <div className="flex justify-between gap-6 py-0.5">
            <span className="text-muted-foreground">{t(cfg.adjustDocumentDueLabel)}</span>
            <span className="font-medium text-blue-600">
              {formatCurrency(allocation.adjustDocumentDue!)}
            </span>
          </div>
        )}
        {allocation.adjustOtherDues?.map((due, idx) => (
          <div key={idx} className="flex items-center justify-between gap-6 py-0.5">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {t('adjustedAgainst')}
              {due.referenceLabel ? (
                <span className="font-mono font-medium text-primary">
                  <CopyField value={due.referenceLabel} />
                </span>
              ) : (
                t('otherDue')
              )}
            </span>
            <span className="font-medium text-blue-600">{formatCurrency(due.amount)}</span>
          </div>
        ))}
        {allocation.accountRefund && (
          <div className="flex justify-between gap-6 py-0.5">
            <span className="text-muted-foreground">
              {t('cashRefundMethod', { method: allocation.accountRefund.paymentMethod })}
            </span>
            <span className={`font-medium ${cfg.totalRefundColor}`}>
              {formatCurrency(allocation.accountRefund.amount)}
            </span>
          </div>
        )}
        {(allocation.counterpartyCredit?.amount ?? 0) > 0 && (
          <div className="flex justify-between gap-6 py-0.5">
            <span className="text-muted-foreground">{t(cfg.creditConversionLabel)}</span>
            <span className="font-medium text-blue-600">
              {formatCurrency(allocation.counterpartyCredit!.amount)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Items table ──────────────────────────────────────────────────────────────

type ReturnItemRow =
  | { kind: 'combo'; key: string; name: string; refundTotal: number }
  | { kind: 'item'; key: string; item: ReturnDetailsItem; inCombo: boolean };

function buildItemRows(items: ReturnDetailsItem[], comboLabel: string): ReturnItemRow[] {
  const rows: ReturnItemRow[] = [];
  for (const group of groupSaleItemsByCombo(items)) {
    if (group.comboLineId) {
      rows.push({
        kind: 'combo',
        key: group.key,
        name: group.comboName ?? comboLabel,
        refundTotal: group.items.reduce((sum, it) => sum + it.refundAmount, 0),
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

function itemSubline(
  item: ReturnDetailsItem,
  cfg: VariantConfig,
  formatCurrency: (n: number) => string,
  canViewCosts: boolean,
  t: (key: string, values?: Record<string, string | number>) => string,
): string {
  const parts: string[] = [];
  if (cfg.showSalePrice && canViewCosts) {
    parts.push(t('costLine', { amount: formatCurrency(item.costPrice * item.quantity) }));
  }
  if ((item.taxAmount ?? 0) > 0) {
    const key = item.taxType === 'inclusive' ? 'taxLineIncl' : 'taxLineExcl';
    parts.push(t(key, { rate: item.taxRate ?? 0, amount: formatCurrency(item.taxAmount!) }));
  }
  return parts.join(' · ');
}

function ReturnItemsTable({
  returnData,
  cfg,
  formatCurrency,
  t,
}: {
  returnData: ReturnDetailsData;
  cfg: VariantConfig;
  formatCurrency: (n: number) => string;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const items = returnData.items ?? [];
  const rows = buildItemRows(items, t('combo'));
  // Sales-return item cost is COGS; the purchases Cost column stays — it's the
  // refund basis of the document itself.
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);

  const columns: SimpleColumn<ReturnItemRow>[] = [
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
            sub={itemSubline(row.item, cfg, formatCurrency, canViewCosts, t) || undefined}
          />
        ),
    },
    {
      key: 'qty',
      header: t('qty'),
      align: 'right',
      cell: (row) => (row.kind === 'item' ? row.item.quantity : null),
    },
    ...(cfg.showSalePrice
      ? ([
          {
            key: 'price',
            header: t('salePrice'),
            align: 'right',
            cell: (row) =>
              row.kind === 'item' && row.item.price != null
                ? formatCurrency(row.item.price)
                : row.kind === 'item'
                  ? '—'
                  : null,
          },
          {
            key: 'discount',
            header: t('disc'),
            align: 'right',
            cell: (row) =>
              row.kind === 'item'
                ? (row.item.discount ?? 0) > 0
                  ? `−${formatCurrency(row.item.discount!)}`
                  : '—'
                : null,
          },
        ] as SimpleColumn<ReturnItemRow>[])
      : ([
          {
            key: 'units',
            header: t('units'),
            align: 'right',
            cell: (row) =>
              row.kind === 'item'
                ? row.item.conversionFactor && row.item.conversionFactor > 1
                  ? `×${row.item.conversionFactor}`
                  : '—'
                : null,
          },
          {
            key: 'cost',
            header: t('cost'),
            align: 'right',
            cell: (row) =>
              row.kind === 'item'
                ? formatCurrency(row.item.costPrice * row.item.quantity)
                : null,
          },
        ] as SimpleColumn<ReturnItemRow>[])),
    {
      key: 'refund',
      header: t('refund'),
      align: 'right',
      cellClassName: `font-semibold ${cfg.refundAmountColor}`,
      cell: (row) =>
        row.kind === 'combo'
          ? `${cfg.totalRefundPrefix}${formatCurrency(row.refundTotal)}`
          : `${cfg.totalRefundPrefix}${formatCurrency(row.item.refundAmount)}`,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">
        {t('returnedItems')}{' '}
        <span className="font-normal text-muted-foreground">({items.length})</span>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed py-4 text-center text-sm text-muted-foreground">
          {t('noItemsRecorded')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <SimpleTable
            className={detailTableClass}
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.key}
            rowClassName={(row) => (row.kind === 'combo' ? comboRowClass : undefined)}
          />
        </div>
      )}
    </div>
  );
}

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
  const t = useTranslations('common.returns.sheet');
  const tPrintDoc = useTranslations('common.printDoc');
  const locale = useLocale() as AppLocale;
  const { user } = useAuthStore();
  const canViewCosts = useHasPermission(PERMISSIONS.costsView);
  if (!returnData && !isLoading) return null;

  const cfg = VARIANT_CONFIG[variant];
  const allocation = returnData?.refundAllocation;
  const hasAllocation =
    !!allocation &&
    ((allocation.adjustDocumentDue ?? 0) > 0 ||
      (allocation.adjustOtherDues?.length ?? 0) > 0 ||
      !!allocation.accountRefund ||
      (allocation.counterpartyCredit?.amount ?? 0) > 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-[760px]">
        <SheetHeader>
          <SheetHeaderBar
            action={
              returnData && (
                <PrintMenu
                  appearance="solid"
                  a4Label={t(cfg.printLabel)}
                  defaultPaper={resolveDefaultPaper(user?.organization)}
                  onPrint={(paper) =>
                    printReturn(returnData, variant, {
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
              <RotateCcw className="h-5 w-5" />
              {t('title')}
              {returnData?.returnNumber ? ` — ${returnData.returnNumber}` : ''}
              {returnData?.returnNumber && (
                <CopyField value={returnData.returnNumber} showValue={false} />
              )}
              {returnData && getStatusBadge(returnData.status, t)}
            </SheetTitle>
            <SheetDescription>{t(cfg.sheetDescription)}</SheetDescription>
          </SheetHeaderBar>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="mt-2 space-y-4 px-4 pb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : returnData ? (
            <div className="mt-2 space-y-6 px-4 pb-6">
              <ReturnStats
                returnData={returnData}
                cfg={cfg}
                formatCurrency={formatCurrency}
                t={t}
              />

              {hasAllocation && (
                <RefundAllocationPanel
                  allocation={allocation!}
                  cfg={cfg}
                  formatCurrency={formatCurrency}
                  t={t}
                />
              )}

              <ReturnItemsTable
                returnData={returnData}
                cfg={cfg}
                formatCurrency={formatCurrency}
                t={t}
              />

              {returnData.notes && <NoteCallout>{returnData.notes}</NoteCallout>}

              <DetailsKv
                rows={[
                  {
                    label: t(cfg.counterpartyLabel),
                    value: returnData.counterpartyName ?? t(cfg.counterpartyFallback),
                  },
                  {
                    label: t('reasonLabel'),
                    value: returnData.reason ? (
                      <span className="capitalize">
                        {returnData.reason.replace(/_/g, ' ')}
                      </span>
                    ) : undefined,
                  },
                  {
                    label: t(cfg.documentLabel),
                    value: (
                      <span className="font-mono text-primary">
                        <CopyField value={returnData.documentRef} />
                      </span>
                    ),
                  },
                  {
                    label: t('returnDate'),
                    value: formatDate(
                      new Date(returnData.date),
                      'dd MMM yyyy hh:mm aa',
                    ),
                  },
                  {
                    label: t('costAmount'),
                    value:
                      canViewCosts && returnData.totalCostAmount != null
                        ? formatCurrency(returnData.totalCostAmount)
                        : undefined,
                    muted: true,
                  },
                ]}
              />
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
