// coding-standard: maintained
/**
 * Translated label for a stock-movement reason (opening_stock, purchase, sale,
 * adjustment, return, transfer, expiry, warranty_replacement). Shared by inventory and product detail
 * surfaces so the reason vocabulary stays consistent (docs/I18N-GLOSSARY.md).
 * Falls back to a title-cased raw reason for values without a translation.
 */

import { useTranslations } from "next-intl";
import { useMemo } from "react";

/** snake_case reason → camelCase message key (opening_stock → openingStock). */
export function movementReasonKey(reason: string): string {
  return reason.replace(/_(\w)/g, (_, c: string) => c.toUpperCase());
}

export function useMovementReasonLabel() {
  const t = useTranslations("common.movementReasons");

  return useMemo(
    () => (reason: string) => {
      const key = movementReasonKey(reason);
      if (t.has(key)) return t(key);
      return reason.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
    },
    [t],
  );
}
