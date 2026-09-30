"use client";
// coding-standard: maintained

import { useEffect } from "react";
import type { StorefrontStore } from "@/lib/storefront-client";
import {
  resolveDesktopHeader,
  resolveLanguageTheme,
  type ResolvedDesktopHeader,
  type ResolvedLanguageTheme,
} from "@/lib/storefront-language-theme";
import { setShopLanguageTheme } from "@/services/storefront/ui-context";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";

/**
 * Which languages and colour schemes the shop offers, draft-aware.
 *
 * Read from the STORE, never from `useStorefrontUI`: every caller already has
 * the store at server render, so a one-language shop's header is drawn without
 * a language switch from the first byte, instead of drawing one and removing
 * it on hydration.
 */
export function useLanguageTheme(store?: StorefrontStore): ResolvedLanguageTheme {
  const draft = useSfPreview((s) => s.languageTheme);
  return resolveLanguageTheme(draft ?? store?.nav?.languageTheme);
}

/** The computer header's behaviour, draft-aware. */
export function useDesktopHeader(store?: StorefrontStore): ResolvedDesktopHeader {
  const draft = useSfPreview((s) => s.desktopHeader);
  return resolveDesktopHeader(draft ?? store?.nav?.desktopHeader);
}

/**
 * Hand the shop's language & theme policy to `StorefrontUIProvider`, and
 * return the attribute that keeps an always-light shop light before paint.
 *
 * Called by BOTH shop frames — `StoreShell` and the builder's `BareStoreFrame`
 * — because a landing page is the shop too, and a Bangla-only shop must not
 * open its landing page in English.
 *
 * `data-scheme="light"` goes on `.sf-shell`, and the storefront layout's
 * no-flash script reads it: that script runs before React and would otherwise
 * paint a shopper's stored dark choice for a frame on a shop that has turned
 * dark mode off.
 *
 * In an effect, not during render: the provider's state is module-level, and
 * writing it while rendering would change a parent mid-render.
 */
export function useApplyLanguageTheme(
  store?: StorefrontStore,
): { "data-scheme"?: "light" } {
  // Keyed on the three values, not the object: the resolver builds a fresh one
  // every render.
  const { languages, defaultLanguage, darkMode } = useLanguageTheme(store);
  useEffect(() => {
    setShopLanguageTheme({ languages, defaultLanguage, darkMode });
  }, [languages, defaultLanguage, darkMode]);
  return darkMode === "light" ? { "data-scheme": "light" } : {};
}
