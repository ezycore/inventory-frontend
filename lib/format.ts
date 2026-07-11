// coding-standard: maintained
/**
 * Locale-aware number/date formatting — the single home for Intl/date-fns
 * locale logic (docs/I18N.md). Components should use the `useFormatters` hook
 * (hooks/use-formatters.ts); these pure functions exist for non-React code
 * (print documents, CSV shaping) where the caller passes the locale.
 *
 * Money stays in lib/currency.ts (useCurrency/formatCurrency) — already
 * lakh/crore via en-IN, which is correct for both locales since digits stay
 * Western app-wide.
 */

import { format as formatDateFns } from "date-fns";
import { bn as bnDateLocale } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns";

import { DEFAULT_LOCALE, type AppLocale } from "@/i18n/config";

/** en uses date-fns' built-in default locale. */
const DATE_FNS_LOCALES: Record<AppLocale, DateFnsLocale | undefined> = {
  en: undefined,
  bn: bnDateLocale,
};

/** Western digits + lakh/crore grouping in every locale (docs/I18N.md). */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  if (value == null || isNaN(value)) return "0";
  return value.toLocaleString("en-IN", options);
}

export function formatDate(
  date: Date | string | number,
  pattern = "dd MMM yyyy",
  locale: AppLocale = DEFAULT_LOCALE,
): string {
  return formatDateFns(new Date(date), pattern, {
    locale: DATE_FNS_LOCALES[locale],
  });
}

export function formatDateTime(
  date: Date | string | number,
  locale: AppLocale = DEFAULT_LOCALE,
): string {
  return formatDate(date, "dd MMM yyyy, hh:mm a", locale);
}
