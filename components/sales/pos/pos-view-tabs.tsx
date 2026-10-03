"use client";
// coding-standard: maintained
import { LayoutGrid, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/components/sales";
import { cn } from "@ui/lib/utils";

export type PosView = "browse" | "cart";

/**
 * Browse products ↔ Cart. The Cart tab always carries the live line count and
 * total, so a cashier browsing products sees each tap land without switching.
 */
export function PosViewTabs({
  view,
  onChange,
  lineCount,
  total,
}: {
  view: PosView;
  onChange: (view: PosView) => void;
  lineCount: number;
  total: number;
}) {
  const t = useTranslations("sales.pos.browse");
  const tab = (id: PosView) =>
    cn(
      "flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors sm:flex-none",
      view === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div role="tablist" className="flex shrink-0 gap-1 rounded-lg bg-foreground/[0.06] p-1 sm:self-start">
      <button type="button" role="tab" aria-selected={view === "browse"} className={tab("browse")} onClick={() => onChange("browse")}>
        <LayoutGrid className="size-4 shrink-0" />
        <span className="truncate">{t("tabBrowse")}</span>
      </button>
      <button type="button" role="tab" aria-selected={view === "cart"} className={tab("cart")} onClick={() => onChange("cart")}>
        <ShoppingCart className="size-4 shrink-0" />
        <span className="truncate">{t("tabCart")}</span>
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground tabular-nums">
          {lineCount}
        </span>
        <span className="hidden font-semibold tabular-nums text-foreground sm:inline">{formatCurrency(total)}</span>
      </button>
    </div>
  );
}
