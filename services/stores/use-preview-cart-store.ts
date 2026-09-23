// coding-standard: maintained
import { create } from "zustand";

/**
 * Whether an admin preview frame draws a **sample cart**.
 *
 * The cart and checkout pages are the two builder pages whose content belongs to
 * the shopper rather than the merchant: with an empty basket the cart draws its
 * empty-cart card and checkout draws two lines of text, so the layout the
 * merchant just picked — and everything they arranged around it — never appears.
 * An empty basket is also the NORMAL state in the editor, because the cart lives
 * in `localStorage` on the shop's own origin and a merchant has usually never
 * shopped there. So the preview fills the basket itself
 * (`services/storefront/use-preview-cart.ts`), and this is the editor's switch
 * for it: the empty state still has to be designable, because shoppers reach it
 * too.
 *
 * Its own store rather than a field on `use-sf-preview-store.ts`: that one is the
 * Customize editor's channel and is fed by `ezycore-preview` messages, while this
 * arrives on the page editor's own channel (`PAGE_PREVIEW_CART`). Default `true`
 * — a merchant who opens the cart page should see a cart, and a frame that
 * reloads before the editor re-sends must not blink through the empty state.
 */
interface PreviewCartState {
  filled: boolean;
  setFilled: (filled: boolean) => void;
}

export const usePreviewCartStore = create<PreviewCartState>()((set) => ({
  filled: true,
  setFilled: (filled) => set({ filled }),
}));
