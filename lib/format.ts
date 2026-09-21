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
import { formatInTimeZone } from "date-fns-tz";

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

/**
 * An INSTANT as a date. Pass the organization's `timeZone` for anything
 * merchant-facing (CLAUDE.md → "Timezones"); without it the browser's zone is
 * used, which is only right for UI with no organization (the public storefront).
 */
export function formatDate(
  date: Date | string | number,
  pattern = "dd MMM yyyy",
  locale: AppLocale = DEFAULT_LOCALE,
  timeZone?: string,
): string {
  const options = { locale: DATE_FNS_LOCALES[locale] };
  return timeZone
    ? formatInTimeZone(new Date(date), timeZone, pattern, options)
    : formatDateFns(new Date(date), pattern, options);
}

export function formatDateTime(
  date: Date | string | number,
  locale: AppLocale = DEFAULT_LOCALE,
  timeZone?: string,
): string {
  return formatDate(date, "dd MMM yyyy, hh:mm a", locale, timeZone);
}

/**
 * A stored DATE-ONLY value (an expiry date): UTC midnight of its calendar day,
 * so it is read in UTC and names the same day in every zone.
 */
export function formatDateOnly(
  date: Date | string | number,
  pattern = "dd MMM yyyy",
  locale: AppLocale = DEFAULT_LOCALE,
): string {
  return formatDate(date, pattern, locale, "UTC");
}

/**
 * Ascending, so the index into this array is the power of 1024 being applied.
 */
const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

/**
 * A byte count at human scale — `1.6 MB`, `2 GB`.
 *
 * Units stay Western abbreviations in both locales, matching the file sizes the
 * upload component already shows app-wide and the Western-digits rule in
 * docs/I18N.md. `B` is whole (there is no such thing as half a byte); every
 * larger unit carries one decimal, which is the difference between a storage
 * meter reading "1.6 MB" and one reading "2 MB" the moment you cross 1.5.
 *
 * The unit is clamped rather than indexed blindly: past a petabyte the raw
 * lookup runs off the end of the array and renders "1.0 undefined".
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  );

  const value = bytes / 1024 ** exponent;
  // A trailing `.0` is noise on a round figure — a plan ceiling should read
  // "2 GB", not "2.0 GB", while a real measurement still keeps its decimal.
  const scaled =
    exponent === 0
      ? String(Math.round(value))
      : value.toFixed(1).replace(/\.0$/, "");

  return `${scaled} ${BYTE_UNITS[exponent]}`;
}
