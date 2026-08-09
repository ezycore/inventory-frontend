import { useEffect } from "react";
import { create } from "zustand";

/**
 * The sentence the current page contributes to the contact launcher's prefilled
 * message — "I'd like to know more about Aurora Puffer (৳4,200)".
 *
 * A store rather than React context because the launcher lives in `StoreShell`,
 * ABOVE every page: a context provider would have to hoist the value into the
 * shell's own state and re-render the entire storefront chrome each time a page
 * published one. The launcher subscribes; nothing else re-renders.
 *
 * Pages compose the sentence themselves (they hold the product, the locale and
 * the currency formatter), so nothing about copy or translation lives here.
 */
interface SfContactState {
  context: string | null;
  setContext: (value: string | null) => void;
}

export const useSfContact = create<SfContactState>((set) => ({
  context: null,
  setContext: (context) => set({ context }),
}));

/**
 * Publish this page's context to the launcher for as long as the page is mounted.
 *
 * **The cleanup is the point.** Without it a shopper who opens a product, then
 * navigates to a CMS page, still messages the merchant about the product —
 * client-side navigation keeps the shell (and the store) alive, so a stale
 * sentence outlives the page that wrote it. Pass `undefined` while the data is
 * still loading; that clears rather than pins a half-built sentence.
 */
export function usePublishContactContext(value: string | undefined): void {
  useEffect(() => {
    useSfContact.getState().setContext(value ?? null);
    return () => useSfContact.getState().setContext(null);
  }, [value]);
}
