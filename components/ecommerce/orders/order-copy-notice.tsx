"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { Button } from "@/ui/components/button";
import type { CopiedFrom } from "./use-order-copy-initial";

/**
 * The previous buyer, SHOWN beside a copied order's customer fields and put into
 * them only on "Use these" — so a repeat order for the same buyer is one click,
 * and a new buyer's order cannot ship to the old address by default.
 */
export function OrderCopyNotice({
  copiedFrom,
  onUse,
}: {
  copiedFrom: CopiedFrom;
  onUse: () => void;
}) {
  const t = useTranslations("ecommerce.orderCopy");
  const c = copiedFrom.customer;
  const place = [c.address, c.area, c.district].filter(Boolean).join(", ");

  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
      {copiedFrom.dropped.length > 0 ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          {t("dropped", { products: copiedFrom.dropped.join(", ") })}
        </p>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{t("previous")}</p>
          <p className="truncate">{[c.name, c.phone].filter(Boolean).join(" · ")}</p>
          {place ? (
            <p className="truncate text-xs text-muted-foreground">{place}</p>
          ) : null}
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onUse}>
          {t("use")}
        </Button>
      </div>
    </div>
  );
}
