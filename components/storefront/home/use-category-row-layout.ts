"use client";
// coding-standard: maintained

import type { StorefrontStore } from "@/lib/storefront-client";
import type { ResolvedHomeCollections } from "@/lib/storefront-templates";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";
import {
  resolveCategoryRowLayout,
  type CategoryRowLayout,
} from "@/components/storefront/home/category-row-layout";

/** The category-row setting currently visible in Customize, else the saved one. */
export function useCategoryRowLayout(
  store: Pick<StorefrontStore, "theme"> | null | undefined,
  defaultLayout: ResolvedHomeCollections["layout"] = "strip",
): CategoryRowLayout {
  const draft = useSfPreview((s) => s.homeCollections);
  return resolveCategoryRowLayout(
    draft ?? store?.theme?.homeCollections,
    defaultLayout,
  );
}
