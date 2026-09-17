// coding-standard: maintained
/**
 * Locale-bound formatters for components — wraps lib/format.ts with the
 * active locale so call sites never touch locale plumbing (docs/I18N.md).
 */

import { useLocale } from "next-intl";
import { useMemo } from "react";

import type { AppLocale } from "@/i18n/config";
import { useOrgCalendar } from "@/hooks/use-org-calendar";
import {
  formatDate,
  formatDateOnly,
  formatDateTime,
  formatNumber,
} from "@/lib/format";

/**
 * Instants are formatted on the ORGANIZATION's calendar, not the browser's
 * (CLAUDE.md → "Timezones"); `formatDateOnly` is for stored date-only values
 * such as an expiry date.
 */
export function useFormatters() {
  const locale = useLocale() as AppLocale;
  const { timezone } = useOrgCalendar();

  return useMemo(
    () => ({
      locale,
      timezone,
      formatNumber,
      formatDate: (date: Date | string | number, pattern?: string) =>
        formatDate(date, pattern, locale, timezone),
      formatDateTime: (date: Date | string | number) =>
        formatDateTime(date, locale, timezone),
      formatDateOnly: (date: Date | string | number, pattern?: string) =>
        formatDateOnly(date, pattern, locale),
    }),
    [locale, timezone],
  );
}
