// coding-standard: maintained
import { create } from "zustand";

/**
 * Ephemeral open state for the mobile menu panel and the search takeover.
 *
 * A store rather than component state because **the control and the panel are
 * mounted in different places in the tree**: the hamburger lives in the header
 * (inside whichever shell is rendering), the Menu tab lives in the bottom bar
 * (pinned outside the shell), and the panel itself is mounted once at the shell
 * level so a template switch cannot leave two of them behind. Same reason
 * `useCartUI` exists, and it behaves the same way — not persisted, closed on
 * every load.
 */
interface MobileNavState {
  menuOpen: boolean;
  searchOpen: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useMobileNav = create<MobileNavState>((set) => ({
  menuOpen: false,
  searchOpen: false,
  // Each opener closes the other: both are full-attention surfaces, and a search
  // takeover painted over an open drawer leaves the drawer's scroll lock on when
  // the takeover closes.
  openMenu: () => set({ menuOpen: true, searchOpen: false }),
  closeMenu: () => set({ menuOpen: false }),
  openSearch: () => set({ searchOpen: true, menuOpen: false }),
  closeSearch: () => set({ searchOpen: false }),
}));
