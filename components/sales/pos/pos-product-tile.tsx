"use client";
// coding-standard: maintained
import { Check, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/components/sales";
import { cn } from "@ui/lib/utils";
import type { PosProductGroup } from "./pos-catalog";

/** Stock at or below this reads as low (red); below 20 as running down (amber). */
const LOW_STOCK = 5;

/**
 * One product in the browser: photo, name, price, stock and how many are
 * already in the cart. Tapping adds one; a product with variants opens the
 * picker instead (`onPick`).
 */
export function PosProductTile({
  group,
  inCart,
  onPick,
}: {
  group: PosProductGroup;
  inCart: number;
  onPick: (group: PosProductGroup) => void;
}) {
  const t = useTranslations("sales.pos.browse");
  const hasVariants = group.rows.length > 1;
  const price =
    group.minPrice === group.maxPrice
      ? formatCurrency(group.minPrice)
      : `${formatCurrency(group.minPrice)}–${group.maxPrice.toLocaleString("en-IN")}`;
  const lowestRow = Math.min(...group.rows.map((r) => r.availableQuantity));

  return (
    <button
      type="button"
      onClick={() => onPick(group)}
      className={cn(
        "group relative flex flex-col gap-1.5 rounded-xl border bg-card p-2 text-left transition-shadow hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        inCart > 0 && "border-primary/60",
      )}
    >
      <span className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-muted">
        {group.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- merchant photos on R2, already sized thumbnails
          <img src={group.photo} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          <Package className="size-8 text-muted-foreground/50" />
        )}
      </span>
      {inCart > 0 && (
        <span className="absolute right-3 top-3 inline-flex h-6 items-center gap-1 rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground shadow-sm">
          <Check className="size-3" strokeWidth={3} />
          {inCart}
        </span>
      )}
      <span className="line-clamp-2 min-h-10 text-sm font-medium leading-5">{group.name}</span>
      {hasVariants && (
        <span className="text-xs text-muted-foreground">{t("variants", { count: group.rows.length })}</span>
      )}
      <span className="mt-auto flex flex-wrap items-center justify-between gap-1">
        <span className="font-bold tabular-nums">{price}</span>
        {group.stock !== null && (
          <span
            className={cn(
              "rounded-full border px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
              lowestRow <= LOW_STOCK
                ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                : group.stock < 20
                  ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                  : "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300",
            )}
          >
            {t("inStock", { count: group.stock })}
          </span>
        )}
      </span>
    </button>
  );
}
