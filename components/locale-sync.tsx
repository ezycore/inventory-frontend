"use client";
// coding-standard: maintained

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { isAppLocale } from "@/i18n/config";
import { setLocaleCookie } from "@/lib/locale";
import { useAuthStore } from "@/services/stores/use-auth-store";

/**
 * Reconciles the rendered locale (NEXT_LOCALE cookie) with the profile locale.
 * The profile is the source of truth — a login on a fresh device adopts the
 * user's saved language on first authenticated render. See docs/I18N.md.
 */
export function LocaleSync() {
  const profileLocale = useAuthStore((state) => state.user?.locale);
  const renderedLocale = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (isAppLocale(profileLocale) && profileLocale !== renderedLocale) {
      setLocaleCookie(profileLocale);
      router.refresh();
    }
  }, [profileLocale, renderedLocale, router]);

  return null;
}
