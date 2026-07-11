"use client";
// coding-standard: maintained

import type { FC } from "react";
import { useTranslations } from "next-intl";

/**
 * Shared "added vs included" tax summary block: an optional **Tax (added)** row
 * (exclusive, on top), the **Total** row, and an optional **Includes … tax in
 * price** memo (inclusive, already inside the total). Single source for this
 * presentation across every cart/sidebar/edit surface — do NOT re-inline it.
 *
 * Renders only the 3 tax-related lines; any Subtotal/Net/Discount rows above it
 * stay owned by the surface. `total` is the surface's tax-correct grand total.
 */
type Props = {
  /** Tax feature active for this area (sales/purchase). When false, only Total renders. */
  show: boolean;
  addedTax: number;
  includedTax: number;
  taxTotal: number;
  total: number;
  totalLabel: string;
  /** `sm` = cart/footer weight, `lg` = sidebar headline weight. */
  totalSize?: "sm" | "lg";
  formatCurrency: (n: number) => string;
};

export const TaxSummaryLines: FC<Props> = ({
  show,
  addedTax,
  includedTax,
  taxTotal,
  total,
  totalLabel,
  totalSize = "sm",
  formatCurrency,
}) => {
  const t = useTranslations("common.tax");
  const lg = totalSize === "lg";
  const memo =
    show && includedTax > 0
      ? t("includesInPrice", { amount: formatCurrency(includedTax) }) +
        (addedTax > 0 ? t("totalTaxSuffix", { amount: formatCurrency(taxTotal) }) : "")
      : null;
  return (
    <>
      {show && addedTax > 0 && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground font-medium">{t("added")}</span>
          <span className="tabular-nums">+{formatCurrency(addedTax)}</span>
        </div>
      )}
      <div className="flex justify-between items-center pt-1">
        <span className={lg ? "font-semibold" : "font-semibold text-sm"}>{totalLabel}</span>
        <span className={`font-bold text-primary tabular-nums ${lg ? "text-lg" : "text-sm"}`}>
          {formatCurrency(total)}
        </span>
      </div>
      {memo && (
        <p className="text-xs text-muted-foreground text-right leading-snug">{memo}</p>
      )}
    </>
  );
};

export default TaxSummaryLines;
