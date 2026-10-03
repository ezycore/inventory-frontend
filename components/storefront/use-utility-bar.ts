"use client";
// coding-standard: maintained

import type { StoreTemplates, StorefrontStore } from "@/lib/storefront-client";
import { resolveTemplates } from "@/lib/storefront-templates";
import {
  headerNeeds,
  resolveUtilityBar,
  type Breakpoint,
  type ResolvedUtilityBar,
} from "@/lib/storefront-utility-bar";
import {
  offersDarkMode,
  offersLanguageSwitch,
} from "@/lib/storefront-language-theme";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import { useLanguageTheme } from "@/components/storefront/use-language-theme";

/** Desktop anatomies, in `TEMPLATE_OPTIONS.header` order. */
export const HEADER_VARIANTS: readonly string[] = [
  "classic",
  "minimal",
  "centered",
  "search-first",
  "clinical",
  "boutique",
];

/**
 * The header anatomy on screen — the Customize draft when one is streaming,
 * otherwise the saved template. Guarded against an unknown id so a template
 * renamed on the backend falls back rather than rendering nothing.
 */
export function useHeaderVariant(
  store?: StorefrontStore,
): StoreTemplates["header"] {
  const previewHeader = useSfPreview((s) => s.header);
  return HEADER_VARIANTS.includes(previewHeader ?? "")
    ? (previewHeader as StoreTemplates["header"])
    : resolveTemplates(store).header;
}

/**
 * The utility bar on screen, draft-aware.
 *
 * A hook rather than a prop because the three places that need the answer sit
 * in TWO React trees: `StoreHeader` renders the desktop bar and the phone bar,
 * while the menu drawer comes from `StoreShell` via `MobileOverlays`. Drilling
 * it would mean threading a prop through the shell for the drawer's benefit
 * alone, and the moment the two trees resolve it differently the shopper gets
 * the duplicate-toggle bug back — so they read one source instead.
 *
 * A switch the shop does not offer is taken out of the bar here, so the bar
 * can never draw one. The Customize editor resolves the bar itself
 * (`resolveUtilityBar`) and never sees this gating — it must save the
 * merchant's placement untouched, so turning a language back on restores it.
 */
export function useResolvedUtilityBar(
  store?: StorefrontStore,
): ResolvedUtilityBar {
  const previewUtilityBar = useSfPreview((s) => s.utilityBar);
  const variant = useHeaderVariant(store);
  const offers = useLanguageTheme(store);
  const bar = resolveUtilityBar(previewUtilityBar ?? store?.nav?.utilityBar, variant);
  return {
    ...bar,
    showLanguage: bar.showLanguage && offersLanguageSwitch(offers),
    showTheme: bar.showTheme && offersDarkMode(offers),
  };
}

/**
 * What the header still owes the shopper at this breakpoint (`headerNeeds`),
 * with the shop's offers folded in — the one call the desktop header, the
 * phone bar and the phone drawer all make, so none of them can draw a switch
 * the shop has turned off.
 */
export function useHeaderNeeds(
  store: StorefrontStore | undefined,
  at: Breakpoint,
): { needsTheme: boolean; needsLang: boolean } {
  const bar = useResolvedUtilityBar(store);
  const offers = useLanguageTheme(store);
  return headerNeeds(bar, at, {
    language: offersLanguageSwitch(offers),
    theme: offersDarkMode(offers),
  });
}
