"use client";
// coding-standard: maintained
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/components/sales";
import { LastSaleReceipt } from "@/components/sales/sell/last-sale-receipt";
import type { SellPageContext } from "@/components/sales/sell/use-sell-page";
import { Button } from "@/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { PosCheckoutPanel } from "./pos-checkout-panel";
import { PosCustomerPanel } from "./pos-customer-panel";

/**
 * Below 1024 px: the running total and Checkout, which opens customer +
 * payment — the desktop's right column — as a bottom sheet. The sheet shuts
 * itself once the cart empties (the sale or draft went through), and the last
 * sale's reprint sits above the bar.
 */
export function PosMobileCheckout({ ctx }: { ctx: SellPageContext }) {
  const t = useTranslations("sales.pos");
  const tSummary = useTranslations("sales.sell.summary");
  const [open, setOpen] = useState(false);
  const hasItems = ctx.items.length > 0;

  return (
    <>
      <LastSaleReceipt ctx={ctx} className="shrink-0 border-t bg-card px-4 py-2" />
      <div className="flex shrink-0 items-center gap-3 border-t bg-card px-4 py-3 shadow-[0_-4px_12px_rgb(0_0_0/0.05)]">
        <div className="min-w-0 flex-1 leading-tight">
          <div className="text-xs text-muted-foreground">{t("cartCount", { count: ctx.items.length })}</div>
          <div className="text-xl font-bold tabular-nums">{formatCurrency(ctx.totalSalePrice)}</div>
        </div>
        <Button size="lg" className="h-12 px-6 text-base" disabled={!hasItems} onClick={() => setOpen(true)}>
          {t("checkout")}
          <ArrowRight className="size-5" />
        </Button>
      </div>
      <Sheet open={open && hasItems} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t("checkout")}</SheetTitle>
            <SheetDescription>{tSummary("totalAmount")}: {formatCurrency(ctx.totalSalePrice)}</SheetDescription>
          </SheetHeader>
          <div className="mx-auto w-full max-w-xl space-y-4 px-4 pb-6">
            <PosCustomerPanel ctx={ctx} />
            <PosCheckoutPanel ctx={ctx} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
