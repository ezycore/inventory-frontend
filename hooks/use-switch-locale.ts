// coding-standard: maintained
/**
 * Switch the UI language: cookie first (instant SSR effect), then persist to
 * the profile so other devices follow. See docs/I18N.md.
 */

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { AppLocale } from "@/i18n/config";
import { getErrorMessage } from "@/lib/error-handling";
import { setLocaleCookie } from "@/lib/locale";
import { profileApi } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";

export function useSwitchLocale() {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const { user, token, setUser } = useAuthStore();

  const switchLocale = async (next: AppLocale) => {
    if (next === locale) return;

    setLocaleCookie(next);
    if (user && token) {
      // Optimistic store update so LocaleSync doesn't revert the cookie
      setUser({ ...user, locale: next }, token);
    }
    router.refresh();

    if (user) {
      try {
        const formData = new FormData();
        formData.append("locale", next);
        await profileApi.update(formData);
      } catch (error) {
        // Non-fatal: the cookie already switched this device; the profile
        // stays behind until the next successful switch or profile save.
        toast.error(getErrorMessage(error));
      }
    }
  };

  return { locale, switchLocale };
}
