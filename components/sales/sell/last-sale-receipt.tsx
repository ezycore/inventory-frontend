"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { PrintMenu } from "@/components/shared/print/print-menu";
import { EmailReceiptButton } from "@/components/sales/history/email-receipt-button";
import { cn } from "@ui/lib/utils";
import type { SellPageContext } from "./use-sell-page";

/**
 * "Last sale · INV-…" with Print and Email for the sale just completed, so the
 * cashier can reprint after the cart has cleared. Renders nothing until a sale
 * completes. Shared by New Sale and the POS counter.
 */
export function LastSaleReceipt({
  ctx,
  className,
}: {
  ctx: SellPageContext;
  className?: string;
}) {
  const t = useTranslations("sales.sell.summary");
  const { lastCompletedSale, printLastReceipt, receiptDefaultPaper } = ctx;

  if (!lastCompletedSale) return null;

  return (
    <div className={cn("flex items-center justify-between gap-2 text-sm", className)}>
      <span className="min-w-0 truncate text-muted-foreground">
        {t("lastSale", { invoice: lastCompletedSale.invoiceNumber })}
      </span>
      <div className="flex items-center gap-2">
        <PrintMenu
          appearance="solid"
          a4Label={t("invoiceLabel")}
          defaultPaper={receiptDefaultPaper}
          onPrint={printLastReceipt}
        />
        <EmailReceiptButton sale={lastCompletedSale} />
      </div>
    </div>
  );
}
