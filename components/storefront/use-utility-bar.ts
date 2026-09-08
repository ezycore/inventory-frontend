"use client";
// coding-standard: maintained

import type { StoreTemplates, StorefrontStore } from "@/lib/storefront-client";
import { resolveTemplates } from "@/lib/storefront-templates";
import {
  resolveUtilityBar,
  type ResolvedUtilityBar,
} from "@/lib/storefront-utility-bar";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";

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
 * Cheap to call repeatedly: both reads are zustand selectors and
 * `resolveUtilityBar` is pure defaulting over a handful of booleans.
 */
export function useResolvedUtilityBar(
  store?: StorefrontStore,
): ResolvedUtilityBar {
  const previewUtilityBar = useSfPreview((s) => s.utilityBar);
  const variant = useHeaderVariant(store);
  return resolveUtilityBar(
    previewUtilityBar ?? store?.nav?.utilityBar,
    variant,
  );
}
