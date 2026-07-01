import { create } from "zustand";

/**
 * Ephemeral storefront preview overrides, streamed from the admin Theme editor
 * via postMessage (see components/storefront/preview-bridge.tsx). Reading these
 * in the shell lets a draft brand colour repaint the ENTIRE preview (header,
 * footer, buttons) instantly — no reload — instead of only the homepage content.
 */
interface SfPreviewState {
  active: boolean;
  brand: string | null;
  accent: string | null;
  /** Raw home-template id (classic | hero-split | minimal) the editor is drafting. */
  home: string | null;
  /** Raw footer-template id (columns | simple | rich) the editor is drafting. */
  footer: string | null;
  /** Draft footer trust badges (Rich footer strip). */
  badges: { text: string; icon?: string }[] | null;
  activate: () => void;
  apply: (patch: {
    brand?: string;
    accent?: string;
    home?: string;
    footer?: string;
    badges?: { text: string; icon?: string }[];
  }) => void;
}

export const useSfPreview = create<SfPreviewState>((set) => ({
  active: false,
  brand: null,
  accent: null,
  home: null,
  footer: null,
  badges: null,
  activate: () => set({ active: true }),
  apply: (patch) =>
    set((s) => ({
      brand: patch.brand !== undefined ? patch.brand : s.brand,
      accent: patch.accent !== undefined ? patch.accent : s.accent,
      home: patch.home !== undefined ? patch.home : s.home,
      footer: patch.footer !== undefined ? patch.footer : s.footer,
      badges: patch.badges !== undefined ? patch.badges : s.badges,
    })),
}));
