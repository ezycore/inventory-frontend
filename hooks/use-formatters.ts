// coding-standard: maintained
/**
 * Locale-bound formatters for components — wraps lib/format.ts with the
 * active locale so call sites never touch locale plumbing (docs/I18N.md).
 */

import { useLocale } from "next-intl";
import { useMemo } from "react";

import type { AppLocale } from "@/i18n/config";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";

export function useFormatters() {
  const locale = useLocale() as AppLocale;

  return useMemo(
    () => ({
      locale,
      formatNumber,
      formatDate: (date: Date | string | number, pattern?: string) =>
        formatDate(date, pattern, locale),
      formatDateTime: (date: Date | string | number) =>
        formatDateTime(date, locale),
    }),
    [locale],
  );
}
