// coding-standard: maintained
/**
 * Locale constants shared by server and client code.
 * Architecture and conventions: docs/I18N.md
 */

export const LOCALES = ["en", "bn"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

/** Cookie mirroring the user's profile locale so SSR paints the right language. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Minimal translate-function shape for non-component code (form configs,
 * column builders) that receives `t` from a calling component's
 * `useTranslations`. Assignable from next-intl's `t` — deliberately callable-
 * only (no `.has`/`.rich`) so lightweight namespace-rebinding closures like
 * `(key, values) => t(\`cart.${key}\`, values)` stay assignable too. Call
 * sites that need `.has()` on a known-shape enum take the real next-intl
 * translator type instead (see e.g. `components/accounts/transactions/columns.tsx`).
 */
export type Translator = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;
