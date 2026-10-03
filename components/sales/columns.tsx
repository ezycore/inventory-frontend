// coding-standard: maintained
import { formatCurrency } from "@/lib/currency";
import type { Translator } from "@/i18n/config";
import { SellOrderItem } from "@/services/stores";
import { Button } from "@/ui/components/button";
import { NumberField } from "@/ui/components/number-field";
import { ColumnDef } from "@tanstack/react-table";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { computeLineTax } from "@/utils/tax";
import { LineTaxCell } from "@/components/shared/line-tax-cell";
import { BatchSelect } from "@/components/shared/batch-select";

/**
 * Editable number input that allows clearing and commits on blur/Enter
 */
function EditableNumberCell({
  value,
  min,
  max,
  fallback,
  onChange,
  className,
  precision,
}: {
  value: number;
  min: number;
  max: number;
  fallback: number;
  onChange: (val: number) => void;
  className?: string;
  precision?: number;
}) {
  return (
    <NumberField
      precision={precision}
      min={min}
      max={max}
      value={value}
      onChange={(v) => onChange(v ?? fallback)}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      className={className}
    />
  );
}

/**
 * Per-line batch picker for expiry-tracked products. Defaults to FEFO (auto);
 * the cashier can override which lot to sell from.
 */
function BatchPickerCell({
  item,
  onUpdateBatch,
}: {
  item: SellOrderItem;
  onUpdateBatch: (id: string, batchId: string | null) => void;
}) {
  const t = useTranslations("sales.sell.cart");

  if (!item.hasExpiry) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <BatchSelect
      productId={item.productId}
      variantId={item.variantId}
      value={item.batchId ?? null}
      onChange={(batchId) => onUpdateBatch(item.id, batchId)}
      emptyLabel={t("autoFefo")}
      hideExpired
      title={t("fefoTooltip")}
      className="h-7 w-[150px] px-2 py-1 text-xs"
    />
  );
}

/**
 * Generate sales order columns with inline quantity/discount controls.
 * When `expiryEnabled`, a per-line Batch picker is added (FEFO by default).
 */
export const getSalesColumns = (
  onUpdateQuantity: (id: string, quantity: number) => void,
  onUpdateDiscount: (id: string, discount: number, price: number) => void,
  onRemove: (id: string) => void,
  /** Caller's `t` bound to "sales.sell.cart" (docs/I18N.md). */
  t: Translator,
  currencySymbol?: string,
  onUpdateBatch?: (id: string, batchId: string | null) => void,
  expiryEnabled?: boolean,
  isTaxEnabled?: boolean,
  /** Optional photo beside the product name (the POS counter passes one). */
  renderThumb?: (item: SellOrderItem) => ReactNode,
): ColumnDef<SellOrderItem>[] => [
    {
      accessorKey: "productName",
      header: t("product"),
      cell: ({ row }) => (
        <div className="flex min-w-[100px] items-center gap-2.5">
          {renderThumb?.(row.original)}
          <div className="min-w-0">
            <span className="font-medium text-sm">{row.original.productName}</span>
            {/*
              `tracked === false` hides it outright rather than printing the
              untracked sentinel — "Available: 9007199254740991 units" under every
              line on the sell page. A shop that counts nothing has no
              availability to report, and any stand-in label would be a claim
              about stock rather than the absence of one.
            */}
            {row.original.tracked !== false &&
              row.original.availableQuantity !== null && (
              <div className="text-xs text-muted-foreground">
                Available: {row.original.availableQuantity} {row.original.unitName || "units"}
              </div>
            )}
            {row.original.tracked !== false && (row.original.heldQuantity ?? 0) > 0 && (
              <div className="text-xs text-amber-700 dark:text-amber-400">
                {t("heldForOnline", { count: row.original.heldQuantity as number })}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: t("priceMrp"),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatCurrency(row.original.price)}
        </span>
      ),
    },
    {
      accessorKey: "costPrice",
      header: t("costPrice"),
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {formatCurrency(row.original.costPrice)}
        </span>
      ),
    },
    {
      accessorKey: "quantity",
      header: t("quantity"),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() =>
                onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
              }
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <EditableNumberCell
              value={item.quantity}
              min={1}
              max={item.availableQuantity ?? Number.MAX_SAFE_INTEGER}
              fallback={1}
              precision={0}
              onChange={(val) => onUpdateQuantity(item.id, val)}
              className="h-7 w-12 text-center text-sm tabular-nums px-1"
            />
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              disabled={item.availableQuantity !== null && item.quantity >= item.availableQuantity}
            >
              <Plus className="h-3 w-3" />
            </Button>
            {item.unitName ? (
              <span className="ml-1 text-xs text-muted-foreground whitespace-nowrap">
                {item.unitName}
              </span>
            ) : null}
          </div>
        );
      },
    },
    ...(expiryEnabled && onUpdateBatch
      ? [
          {
            id: "batch",
            header: t("batch"),
            cell: ({ row }: { row: { original: SellOrderItem } }) => (
              <BatchPickerCell
                item={row.original}
                onUpdateBatch={onUpdateBatch}
              />
            ),
          } as ColumnDef<SellOrderItem>,
        ]
      : []),
    {
      accessorKey: "discount",
      header: t("discount", { symbol: currencySymbol || "" }),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <EditableNumberCell
            value={item.discount || 0}
            min={0}
            max={item.price}
            fallback={0}
            precision={2}
            onChange={(val) => onUpdateDiscount(item.id, val, item.price)}
            className="h-7 w-16 text-center text-sm tabular-nums px-1"
          />
        );
      },
    },
    ...(isTaxEnabled
      ? [
          {
            id: "tax",
            header: t("tax"),
            cell: ({ row }: { row: { original: SellOrderItem } }) => {
              const item = row.original;
              const { taxAmount } = computeLineTax({
                price: item.price,
                quantity: item.quantity,
                discount: item.discount,
                taxRate: item.taxRate,
                taxType: item.taxType,
              });
              return (
                <LineTaxCell
                  rate={item.taxRate}
                  amount={taxAmount}
                  type={item.taxType}
                  formatCurrency={formatCurrency}
                />
              );
            },
          } as ColumnDef<SellOrderItem>,
        ]
      : []),
    {
      accessorKey: "total",
      header: t("total"),
      cell: ({ row }) => (
        <span className="text-sm font-semibold tabular-nums">
          {formatCurrency(row.original.total)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(row.original.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];