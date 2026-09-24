"use client";
// coding-standard: maintained

import { useMemo } from "react";
import type {
  CatalogCategory,
  HeaderMenuSource,
  StorefrontStore,
} from "@/lib/storefront-client";
import {
  buildMenuTree,
  categoryNodes,
  phoneMenuTree,
  resolveMenuSettings,
  type MenuNode,
  type ResolvedMenuSettings,
} from "@/lib/storefront-menu";
import { resolveHeaderMenu } from "@/lib/storefront-templates";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";

export interface StoreMenu {
  settings: ResolvedMenuSettings;
  source: HeaderMenuSource;
  /** Desktop: the header row and its dropdowns. */
  tree: MenuNode[];
  /** Phone: the menu panel — `tree` plus decision B's category safety net. */
  phoneTree: MenuNode[];
  /**
   * The category tree alone — the sidebar (decision C: always the categories,
   * whatever the menu source) and the phone chips row.
   */
  categories: MenuNode[];
}

/**
 * The shop's menu, with the Customize draft applied — **the one read every
 * menu surface shares**.
 *
 * The header, the phone bar and the sidebar each used to read the menu their
 * own way, and the phone panel read only the SAVED store: a merchant building a
 * menu watched the desktop preview change while the phone preview stood still.
 * Draft first, like every other value the preview streams.
 *
 * The legacy source fallback reads the RAW item count (a menu holding only a
 * collections block with nothing listed still chose "custom").
 */
export function useStoreMenu(
  store: StorefrontStore | undefined,
  categories: CatalogCategory[],
  base: string,
): StoreMenu {
  const previewSrc = useSfPreview((s) => s.headerMenuSrc);
  const previewItems = useSfPreview((s) => s.navHeader);
  const previewMenu = useSfPreview((s) => s.navMenu);

  const items = previewItems ?? store?.nav?.header;
  const templates = store?.templates;
  const savedMenu = store?.nav?.menu;

  return useMemo(() => {
    const list = items ?? [];
    const source = resolveHeaderMenu(
      { ...templates, ...(previewSrc ? { headerMenu: previewSrc } : {}) },
      list.length > 0,
    );
    const settings = resolveMenuSettings(previewMenu ?? savedMenu);
    const args = {
      base,
      items: list,
      source,
      categories,
      subcategories: settings.subcategories,
    };
    return {
      settings,
      source,
      tree: buildMenuTree(args),
      phoneTree: phoneMenuTree(args),
      categories: categoryNodes(base, categories, settings.subcategories),
    };
  }, [items, templates, savedMenu, previewSrc, previewMenu, base, categories]);
}
