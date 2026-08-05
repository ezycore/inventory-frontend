import { create } from "zustand";
import { resolveTemplates } from "@/lib/storefront-templates";
import type {
  CatalogCategory,
  StoreAnnouncement,
  StoreFooterContentPages,
  StoreFooterGroup,
  StoreHeroBanner,
  StoreHeroSlide,
  StoreMenuItem,
  StoreTemplates,
  StoreTemplatesRaw,
  StorefrontImage,
  StorefrontStore,
} from "@/lib/storefront-client";

/**
 * Ephemeral storefront preview overrides, streamed from the admin Customize editor
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
  /**
   * Draft homepage section order (Customize → Home page). An **empty array is a
   * real draft** — "every section switched off" — so consumers must use
   * `?? saved` and never a truthiness check. `null` alone means "not drafted".
   */
  homepageSections: string[] | null;
  /** Raw footer-template id (columns | simple | rich) the editor is drafting. */
  footer: string | null;
  /** Raw header-template id (classic | minimal | centered) the editor is drafting. */
  header: string | null;
  /** Raw product-card style (standard | compact | bold) the editor is drafting. */
  cardStyle: string | null;
  /** Raw card CTA layout (add | add-buy | icons | buy-first | reveal | icon-only). */
  cardActions: string | null;
  /** Raw listing pagination mode (pages | infinite | load-more) the editor is drafting. */
  pagination: string | null;
  /** Raw collection-page layout (grid-3 | grid-4 | sidebar) the editor is drafting. */
  collection: string | null;
  /** Raw product-page layout (gallery-left | gallery-top | sticky-bar). */
  product: string | null;
  /** Raw checkout layout (single-page | multi-step) the editor is drafting. */
  checkout: string | null;
  /** Draft trust promises — Rich footer strip and the home trust row. */
  badges: { text: string; subtitle?: string; icon?: string }[] | null;
  /** Draft home promo tiles (hero-split layout). */
  promoTiles: { label?: string; title?: string; link?: string }[] | null;
  /** Draft visual vocabulary (typeface / type scale / density / corners). */
  design: { font?: string; scale?: string; density?: string; radius?: string } | null;
  /** Draft home hero carousel slides. */
  heroSlides: StoreHeroSlide[] | null;
  /** Draft home hero source ("slides" | "banner") the editor is drafting. */
  heroSrc: string | null;
  /** Draft static banner-hero copy overrides. */
  heroBanner: StoreHeroBanner | null;
  /** Draft header menu source ("collections" | "custom"). */
  headerMenuSrc: string | null;
  /** Draft custom header menu items (Customize → Header). */
  navHeader: StoreMenuItem[] | null;
  /** Draft announcement bar (Customize → Announcement bar). */
  announcement: StoreAnnouncement | null;
  /** Draft footer link groups (Customize → Footer), already trimmed like the save path. */
  footerGroups: StoreFooterGroup[] | null;
  /** Draft controls for the auto content-pages footer column. */
  footerContentPages: StoreFooterContentPages | null;
  /**
   * Draft store logo and banner.
   *
   * These two are `undefined` until the editor has sent one, where every other field starts `null`,
   * and the distinction is load-bearing: `null` is a *real* value here — "no image" — so a consumer
   * cannot use `?? saved` to fall back. It must check `!== undefined`, or removing a logo would
   * silently show the saved one again and the removal would look broken.
   *
   * The editor sends the **effective** logo (store logo, else the organization's), because that is
   * what the backend resolves for the public payload — sending the raw store logo would blank the
   * header the moment a merchant removed the store-specific override.
   */
  logo?: StorefrontImage | null;
  banner?: StorefrontImage | null;
  /**
   * Draft collections from the Customize collections panel: already ordered
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
    homepageSections?: string[];
    footer?: string;
    header?: string;
    cardStyle?: string;
    cardActions?: string;
    pagination?: string;
    collection?: string;
    product?: string;
    checkout?: string;
    badges?: { text: string; subtitle?: string; icon?: string }[];
    promoTiles?: { label?: string; title?: string; link?: string }[];
    design?: { font?: string; scale?: string; density?: string; radius?: string };
    heroSlides?: StoreHeroSlide[];
    heroSrc?: string;
    heroBanner?: StoreHeroBanner;
    headerMenuSrc?: string;
    navHeader?: StoreMenuItem[];
    announcement?: StoreAnnouncement;
    collections?: CatalogCategory[];
    footerGroups?: StoreFooterGroup[];
    footerContentPages?: StoreFooterContentPages;
    // `null` is meaningful (image removed), so these are nullable in the patch too.
    logo?: StorefrontImage | null;
    banner?: StorefrontImage | null;
  }) => void;
}

export const useSfPreview = create<SfPreviewState>((set) => ({
  active: false,
  brand: null,
  accent: null,
  home: null,
  homepageSections: null,
  footer: null,
  header: null,
  cardStyle: null,
  cardActions: null,
  pagination: null,
  collection: null,
  product: null,
  checkout: null,
  badges: null,
  promoTiles: null,
  design: null,
  heroSlides: null,
  heroSrc: null,
  heroBanner: null,
  headerMenuSrc: null,
  navHeader: null,
  announcement: null,
  collections: null,
  footerGroups: null,
  footerContentPages: null,
  logo: undefined,
  banner: undefined,
  activate: () => set({ active: true }),
  apply: (patch) =>
    set((s) => ({
      brand: patch.brand !== undefined ? patch.brand : s.brand,
      accent: patch.accent !== undefined ? patch.accent : s.accent,
      home: patch.home !== undefined ? patch.home : s.home,
      homepageSections:
        patch.homepageSections !== undefined
          ? patch.homepageSections
          : s.homepageSections,
      footer: patch.footer !== undefined ? patch.footer : s.footer,
      header: patch.header !== undefined ? patch.header : s.header,
      cardStyle: patch.cardStyle !== undefined ? patch.cardStyle : s.cardStyle,
      cardActions:
        patch.cardActions !== undefined ? patch.cardActions : s.cardActions,
      pagination: patch.pagination !== undefined ? patch.pagination : s.pagination,
      collection: patch.collection !== undefined ? patch.collection : s.collection,
      product: patch.product !== undefined ? patch.product : s.product,
      checkout: patch.checkout !== undefined ? patch.checkout : s.checkout,
      badges: patch.badges !== undefined ? patch.badges : s.badges,
      promoTiles:
        patch.promoTiles !== undefined ? patch.promoTiles : s.promoTiles,
      design: patch.design !== undefined ? patch.design : s.design,
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
      footerGroups:
        patch.footerGroups !== undefined ? patch.footerGroups : s.footerGroups,
      footerContentPages:
        patch.footerContentPages !== undefined
          ? patch.footerContentPages
          : s.footerContentPages,
      logo: patch.logo !== undefined ? patch.logo : s.logo,
      banner: patch.banner !== undefined ? patch.banner : s.banner,
    })),
}));

/**
 * Resolve a previewable image against its saved value.
 *
 * Every other override can use `draft ?? saved`, because `null` means "nothing drafted". Images
 * can't: `null` is a legitimate draft meaning "removed", so the sentinel for "the editor hasn't
 * sent one" has to be `undefined`. Three components need that distinction (header, footer, favicon)
 * plus the home banner — one helper so the rule is stated once and can't be half-remembered.
 */
export const useSfPreviewImage = (
  field: "logo" | "banner",
  saved?: StorefrontImage | null,
): StorefrontImage | null | undefined => {
  const draft = useSfPreview((s) => s[field]);
  return draft !== undefined ? draft : saved;
};

/**
 * Per-page layout keys the Customize editor streams under their own name. The
 * rest of `templates` reaches its consumers through the shell (brand colours,
 * header, footer, cards), so only the ones a single page reads live here.
 */
type DraftedTemplateKey = "collection" | "product" | "checkout" | "pagination";

/**
 * One page's layout variant, with the Customize draft applied.
 *
 * **Every page that renders a `templates` variant must read it through this
 * hook, never `resolveTemplates(store)` directly** — that is what makes the
 * choice repaint while a merchant is picking it. Reading the resolver directly
 * pins the page to the SAVED value, so the picker looks broken until Save: the
 * bug this hook was generalised (from a pagination-only version) to kill.
 */
export const useStoreTemplate = <K extends DraftedTemplateKey>(
  store: Pick<StorefrontStore, "templates"> | null | undefined,
  key: K,
): StoreTemplates[K] => {
  const draft = useSfPreview((s) => s[key]);
  const templates: StoreTemplatesRaw = { ...store?.templates };
  if (draft) templates[key] = draft;
  return resolveTemplates({ templates })[key];
};
