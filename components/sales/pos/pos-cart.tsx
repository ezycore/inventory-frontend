"use client";
// coding-standard: maintained
import { ScanBarcode, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SellPageContext } from "@/components/sales/sell/use-sell-page";
import { useConfirm } from "@/hooks/use-confirm";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { CardTable } from "@/ui/components/custom/card-table";
import { PosCartCards } from "./pos-cart-cards";

/**
 * The order lines, sized to the space it gets (`@container`), not the screen:
 * New Sale's own table (`ctx.salesColumns` — quantity, batch, discount, VAT,
 * cost gating, all unchanged) plus photos once it is ~768 px wide, and the same
 * lines as cards below that — a phone, a tablet, or a narrow laptop with the
 * payment column open beside it.
 */
export function PosCart({
  ctx,
  thumbnails,
}: {
  ctx: SellPageContext;
  thumbnails: Map<string, string>;
}) {
  const t = useTranslations("sales.sell");
  const tPos = useTranslations("sales.pos");
  const { items, salesColumns, clearAll } = ctx;
  const { confirm, ConfirmDialog } = useConfirm({
    title: t("clearAllTitle"),
    description: t("clearAllDescription"),
    confirmLabel: t("clear"),
    confirmClassName: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  });

  const handleClearAll = async () => {
    if (await confirm()) clearAll();
  };

  return (
    <section className="@container flex h-full min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-xs">
      <div className="flex items-center gap-2 px-3 py-2.5 @3xl:px-4">
        <h2 className="text-sm font-semibold">{t("orderItems")}</h2>
        <Badge variant="secondary">{t("itemCount", { count: items.length })}</Badge>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-muted-foreground hover:text-destructive"
          onClick={handleClearAll}
          disabled={items.length === 0}
        >
          <Trash2 className="size-4" />
          {t("clear")}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 border-t px-6 py-12 text-center text-muted-foreground">
          <ScanBarcode className="size-10 stroke-[1.5]" />
          <p className="font-medium text-foreground">{tPos("emptyTitle")}</p>
          <p className="text-sm">{tPos("emptyHint")}</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto border-t">
          <div className="hidden @3xl:block">
            <CardTable
              columns={salesColumns}
              data={items}
              emptyMessage={t("noItems")}
              showCard={false}
            />
          </div>
          <div className="@3xl:hidden">
            <PosCartCards ctx={ctx} thumbnails={thumbnails} />
          </div>
        </div>
      )}
      <ConfirmDialog />
    </section>
  );
}
