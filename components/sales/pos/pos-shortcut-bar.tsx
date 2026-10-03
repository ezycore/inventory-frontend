"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { LastSaleReceipt } from "@/components/sales/sell/last-sale-receipt";
import type { SellPageContext } from "@/components/sales/sell/use-sell-page";
import { PosKbd } from "./pos-kbd";

/** Desktop footer: the keyboard shortcuts, and reprint/email for the last sale. */
export function PosShortcutBar({ ctx }: { ctx: SellPageContext }) {
  const t = useTranslations("sales.pos.shortcuts");

  return (
    <footer className="hidden h-11 shrink-0 items-center gap-5 border-t bg-card px-4 text-xs text-muted-foreground lg:flex">
      <span className="inline-flex items-center gap-1.5"><PosKbd>F2</PosKbd>{t("scanSearch")}</span>
      <span className="inline-flex items-center gap-1.5"><PosKbd>F4</PosKbd>{t("customer")}</span>
      <span className="inline-flex items-center gap-1.5"><PosKbd>F8</PosKbd>{t("confirm")}</span>
      <span className="inline-flex items-center gap-1.5"><PosKbd>Esc</PosKbd>{t("close")}</span>
      <LastSaleReceipt ctx={ctx} className="ml-auto" />
    </footer>
  );
}
