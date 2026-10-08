"use client";
// coding-standard: maintained
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SellOrderItem } from "@/services/stores";
import { useWarrantyOf } from "@/components/sales/serials/use-serial-kinds";

/**
 * The cart line's "12 months · Replacement" chip, so the cashier sees what is
 * being promised before the sale. The note, if any, shows on hover. Renders
 * nothing for a product without a warranty, or while warranty is off.
 */
export function CartLineWarranty({ item }: { item: SellOrderItem }) {
  const t = useTranslations("sales.warranty");
  const warrantyOf = useWarrantyOf();
  const warranty = warrantyOf(item);
  if (!warranty) return null;

  return (
    <span
      title={warranty.note || undefined}
      className="inline-flex items-center gap-1 rounded-md border border-sky-500/40 px-1.5 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-400"
    >
      <ShieldCheck className="size-3.5" />
      {t("lookup.months", { months: warranty.months })} · {t(`kinds.${warranty.kind}`)}
    </span>
  );
}
