import { create } from "zustand";
import type {
  CatalogCategory,
  StoreAnnouncement,
  StoreHeroBanner,
  StoreHeroSlide,
  StoreMenuItem,
} from "@/lib/storefront-client";

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
  /** Raw header-template id (classic | minimal | centered) the editor is drafting. */
  header: string | null;
  /** Raw product-card style (standard | compact | bold) the editor is drafting. */
  cardStyle: string | null;
  /** Draft footer trust badges (Rich footer strip). */
  badges: { text: string; icon?: string }[] | null;
  /** Draft home hero carousel slides. */
  heroSlides: StoreHeroSlide[] | null;
  /** Draft home hero source ("slides" | "banner") the editor is drafting. */
  heroSrc: string | null;
  /** Draft static banner-hero copy overrides. */
  heroBanner: StoreHeroBanner | null;
  /** Draft header menu source ("collections" | "custom"). */
  headerMenuSrc: string | null;
  /** Draft custom header menu items (Navigation → Header menu). */
  navHeader: StoreMenuItem[] | null;
  /** Draft announcement bar (Navigation → Announcement bar). */
  announcement: StoreAnnouncement | null;
  /**
   * Draft collections from the Navigation → Collections panel: already ordered
   * and filtered to the listed ones, with display names applied. Overrides the
   * fetched category list everywhere it's shown (header links + home chips), so
   * unsaved reordering previews live.
   */
  collections: CatalogCategory[] | null;
  activate: () => void;
  apply: (patch: {
    brand?: string;
    accent?: string;
    home?: string;
    footer?: string;
    header?: string;
    cardStyle?: string;
    badges?: { text: string; icon?: string }[];
    heroSlides?: StoreHeroSlide[];
    heroSrc?: string;
    heroBanner?: StoreHeroBanner;
    headerMenuSrc?: string;
    navHeader?: StoreMenuItem[];
    announcement?: StoreAnnouncement;
    collections?: CatalogCategory[];
  }) => void;
}

export const useSfPreview = create<SfPreviewState>((set) => ({
  active: false,
  brand: null,
  accent: null,
  home: null,
  footer: null,
  header: null,
  cardStyle: null,
  badges: null,
  heroSlides: null,
  heroSrc: null,
  heroBanner: null,
  headerMenuSrc: null,
  navHeader: null,
  announcement: null,
  collections: null,
  activate: () => set({ active: true }),
  apply: (patch) =>
    set((s) => ({
      brand: patch.brand !== undefined ? patch.brand : s.brand,
      accent: patch.accent !== undefined ? patch.accent : s.accent,
      home: patch.home !== undefined ? patch.home : s.home,
      footer: patch.footer !== undefined ? patch.footer : s.footer,
      header: patch.header !== undefined ? patch.header : s.header,
      cardStyle: patch.cardStyle !== undefined ? patch.cardStyle : s.cardStyle,
      badges: patch.badges !== undefined ? patch.badges : s.badges,
      heroSlides:
        patch.heroSlides !== undefined ? patch.heroSlides : s.heroSlides,
      heroSrc: patch.heroSrc !== undefined ? patch.heroSrc : s.heroSrc,
      heroBanner:
        patch.heroBanner !== undefined ? patch.heroBanner : s.heroBanner,
      headerMenuSrc:
        patch.headerMenuSrc !== undefined ? patch.headerMenuSrc : s.headerMenuSrc,
      navHeader: patch.navHeader !== undefined ? patch.navHeader : s.navHeader,
      announcement:
        patch.announcement !== undefined ? patch.announcement : s.announcement,
      collections:
        patch.collections !== undefined ? patch.collections : s.collections,
    })),
}));
