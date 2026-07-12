import { create } from "zustand";

/**
 * Ephemeral cart-drawer open state (not persisted). Lets the header cart button,
 * product pages, and the slide-over drawer coordinate without prop-drilling.
 */
interface CartUIState {
  open: boolean;
  openCart: () => void;
  closeCart: () => void;
}

export const useCartUI = create<CartUIState>((set) => ({
  open: false,
  openCart: () => set({ open: true }),
  closeCart: () => set({ open: false }),
}));
