"use client";
// coding-standard: maintained

import { cn } from "@ui/lib/utils";

import { useSwitchLocale } from "@/hooks/use-switch-locale";
import type { AppLocale } from "@/i18n/config";

/**
 * Minimal "EN | বাং" language toggle for pre-auth pages (login/signup).
 * Cookie-only there — no profile exists yet; after login the profile adopts
 * the cookie's language on first save. See docs/I18N.md.
 */
export function LocaleToggle({ className }: { className?: string }) {
  const { locale, switchLocale } = useSwitchLocale();

  const options: { value: AppLocale; label: string }[] = [
    { value: "en", label: "EN" },
    { value: "bn", label: "বাং" },
  ];

  return (
    <div className={cn("flex items-center gap-1 text-sm", className)}>
      {options.map((option, index) => (
        <span key={option.value} className="flex items-center gap-1">
          {index > 0 && <span className="text-muted-foreground">|</span>}
          <button
            type="button"
            onClick={() => switchLocale(option.value)}
            className={cn(
              "rounded px-1.5 py-0.5 transition-colors hover:text-foreground",
              locale === option.value
                ? "font-semibold text-foreground"
                : "text-muted-foreground",
            )}
            aria-pressed={locale === option.value}
          >
            {option.label}
          </button>
        </span>
      ))}
    </div>
  );
}
