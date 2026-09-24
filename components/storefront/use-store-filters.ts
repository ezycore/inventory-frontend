"use client";
// coding-standard: maintained

import { useMemo } from "react";
import type { StorefrontStore } from "@/lib/storefront-client";
import {
  resolveFilterSettings,
  type ResolvedFilterSettings,
} from "@/lib/storefront-filters";
import { useSfPreview, useStoreTemplate } from "@/services/stores/use-sf-preview-store";

/**
 * The shop's filter & sort settings, with the Customize draft applied — the one
 * read the collection, campaign and search pages share (plan §1: site-wide, so
 * search, which is not a builder page, gets the same answer).
 *
 * `layout` is a `collection-grid` section's own layout choice, when there is
 * one; its `sidebar` value is the legacy way to ask for a filters sidebar (see
 * `resolveFilterSettings`).
 */
export function useStoreFilters(
  store: StorefrontStore | undefined,
  layout?: string,
): ResolvedFilterSettings {
  const draft = useSfPreview((s) => s.navFilters);
  const saved = store?.nav?.filters;
  const legacyLayout = useStoreTemplate(store, "collection", layout);
  return useMemo(
    () => resolveFilterSettings(draft ?? saved, legacyLayout),
    [draft, saved, legacyLayout],
  );
}
