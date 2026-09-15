"use client";
// coding-standard: maintained

import type { StoreWord } from "@/lib/storefront-builder/store-words";
import { useStorefrontUI } from "@/services/storefront/ui-context";

/**
 * One word of the storefront's own wording, in the shopper's language. The
 * server renders the default language; a shopper who chose another sees it
 * after hydration, as on the classic home page. Loaded only through the island
 * map.
 */
export function StoreWordIsland({ word }: { word: StoreWord }) {
  const { t } = useStorefrontUI();
  return <>{t[word]}</>;
}
