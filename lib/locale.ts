// coding-standard: maintained
/**
 * Client-side locale cookie helper. The NEXT_LOCALE cookie mirrors the
 * user's profile locale so SSR paints the right language (docs/I18N.md).
 */

import { setCookie } from "cookies-next";

import { LOCALE_COOKIE, type AppLocale } from "@/i18n/config";

export function setLocaleCookie(locale: AppLocale) {
  setCookie(LOCALE_COOKIE, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
