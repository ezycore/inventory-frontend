// coding-standard: maintained
/**
 * Which optional pages a store serves — the page controls of
 * `inventory-backend/docs/plan/storefront-builder.md` §6.
 *
 * One reader for all three, because they are read from five places (the desktop
 * header, the phone chrome, the cart drawer, three routes and the sitemap) and
 * the default has to be the same in every one of them: **absent means ON**. A
 * store's payload predates these switches, or a fetch cached before they shipped
 * carries no block at all, and `store.pages?.search` read directly would close
 * the search of every such shop.
 *
 * The backend resolves the block (`storefrontService.getStoreInfo`) — this is
 * only the client-side guard for a payload that has not caught up yet.
 */
import type { StorefrontStore } from "@/lib/storefront-client";
import type {
  MobileActionId,
  MobileChrome,
  MobileTabId,
} from "@/lib/storefront-mobile";

export interface StorePageControls {
  /** Header search and the `/search` page. */
  search: boolean;
  /** The full `/cart` page; off ⇒ the drawer alone. */
  cartPage: boolean;
  /** Sign-in and the account area; off ⇒ guest checkout and tracking only. */
  accounts: boolean;
}

export function storePages(store?: StorefrontStore | null): StorePageControls {
  const pages = store?.pages;
  return {
    search: pages?.search !== false,
    cartPage: pages?.cartPage !== false,
    accounts: pages?.accounts !== false,
  };
}

/**
 * The phone chrome with the controls of a switched-off page removed.
 *
 * Applied to the RESOLVED chrome rather than to the templates: the five
 * templates and the merchant's slot overrides answer "where do my controls go",
 * and this answers the separate "which pages exist". Merging them would mean a
 * merchant who switches search off and on again loses the slot they had put it
 * in.
 *
 * Pure, and here rather than in the hook, so the filtering can be tested
 * without a React tree — this is the half with the edge cases in it.
 */
export function chromeWithPageControls<T extends MobileChrome>(
  chrome: T,
  { search, accounts }: Pick<StorePageControls, "search" | "accounts">,
): T {
  const gone = new Set<MobileActionId>();
  if (!search) gone.add("search");
  if (!accounts) gone.add("account");
  if (gone.size === 0) return chrome;
  return {
    ...chrome,
    left: chrome.left.filter((id) => !gone.has(id)),
    right: chrome.right.filter((id) => !gone.has(id)),
    tabs: chrome.tabs.filter((id) => !gone.has(id as MobileActionId)) as MobileTabId[],
    // The two places search is a FIELD rather than a glyph. Dropping the row
    // entirely — rather than leaving an empty one — is what keeps the bar the
    // height it was before the merchant switched search off.
    searchInline: search ? chrome.searchInline : false,
    row: !search && chrome.row === "search" ? "none" : chrome.row,
  };
}
