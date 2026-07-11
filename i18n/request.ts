// coding-standard: maintained
/**
 * next-intl request config (no i18n routing — locale comes from the
 * NEXT_LOCALE cookie, mirrored from the user's profile; see docs/I18N.md).
 */

import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isAppLocale, type AppLocale } from "./config";

/** One message file per namespace under messages/<locale>/ — see docs/I18N.md. */
const NAMESPACES = [
  "common",
  "auth",
  "layout",
  "dashboard",
  "products",
  "inventory",
  "sales",
  "purchases",
  "customers",
  "suppliers",
  "accounts",
  "reports",
  "settings",
] as const;

async function loadMessages(locale: AppLocale) {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => {
      const mod = await import(`../messages/${locale}/${ns}.json`);
      return [ns, mod.default] as const;
    }),
  );
  return Object.fromEntries(entries);
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isAppLocale(raw) ? raw : DEFAULT_LOCALE;

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
