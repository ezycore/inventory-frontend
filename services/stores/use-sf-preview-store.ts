// coding-standard: maintained
import { create } from "zustand";
import { resolveTemplates } from "@/lib/storefront-templates";
import type { StoreDesign } from "@/lib/storefront-theme";
import type { ThemeSample } from "@/lib/storefront-theme-samples";
import type { MobileChromeOverrides } from "@/lib/storefront-mobile";
import type {
  CatalogCategory,
  StoreAnnouncement,
  StoreCampaignStrip,
  StoreContactButton,
  StoreFooterContentPages,
  StoreFooterGroup,
  StoreFooterPaymentMethods,
  StoreFooterNewsletter,
  StoreHeroBanner,
  StoreHeroSlide,
  StoreHomeCollections,
  StoreHomeSection,
  StoreSectionConfig,
  StoreLogoStyle,
  StoreMenuItem,
  StoreTemplates,
  StoreTemplatesRaw,
  StoreUtilityBar,
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
  /** Device selected by Customize; iframe pointer media queries cannot infer it. */
  previewDevice: "desktop" | "mobile" | null;
  brand: string | null;
  accent: string | null;
  /** Raw home-template id (classic | hero-split | minimal) the editor is drafting. */
  home: string | null;
  /**
   * Draft homepage SECTION list (Customize → Home page → Sections). Empty
   * array is NOT a draft — it means "the merchant turned everything off", which
   * the resolver treats as unset so the page never goes blank mid-edit.
   */
  homepageSections: StoreHomeSection[] | null;
  /**
   * Draft per-section config (Customize → Home page → Sections) — CONFIG only,
   * never products. A row the merchant just re-pointed has never been
   * server-rendered, so the homepage matches these back to the renders it
   * already has by signature; see `components/storefront/store-home.tsx`.
   */
  sectionConfig: StoreSectionConfig[] | null;
  /** Raw footer-template id (columns | simple | rich) the editor is drafting. */
  footer: string | null;
  /** Raw header-template id (classic | minimal | centered) the editor is drafting. */
  header: string | null;
  /** Raw open-hero alignment (left | center) the editor is drafting. */
  heroAlign: string | null;
  /** Raw product-card style (standard | compact | bold) the editor is drafting. */
  cardStyle: string | null;
  /** Raw card CTA layout (add | add-buy | icons | buy-first | reveal | icon-only). */
  cardActions: string | null;
  /** Raw image fit (fit | crop) the editor is drafting. */
  imageFit: string | null;
  /** Raw product-photo frame (square | portrait | landscape | tall). */
  imageRatio: string | null;
  /** Raw category-tiles presentation (tile | overlay) the editor is drafting. */
  categoryTiles: string | null;
  /** Raw account-area layout (sidebar | tabs | panel | editorial). */
  accountLayout: string | null;
  /** Raw content frame (centered | banner | panel | editorial) for CMS + tracking. */
  contentLayout: string | null;
  /** Raw cart layout (panel | compact | cards | editorial). */
  cartLayout: string | null;
  /** Raw page skeleton (stacked | rail) the editor is drafting. */
  shell: string | null;
  /** Raw mobile-chrome template id (see `lib/storefront-mobile.ts`). */
  mobile: string | null;
  /**
   * Draft mobile-chrome overrides — the slot editor's unsaved arrangement.
   *
   * Two keys rather than one because the picker and the slot editor are separate
   * controls: a merchant who has only switched template has drafted `mobile`
   * with no `mobileChrome`, and folding them together would make the second one
   * override the first with a stale arrangement.
   */
  mobileChrome: MobileChromeOverrides | null;
  /** Raw listing pagination mode (pages | infinite | load-more) the editor is drafting. */
  pagination: string | null;
  /** Raw collection-page layout (grid-3 | grid-4 | sidebar) the editor is drafting. */
  collection: string | null;
  /** Raw product-page layout (gallery-left | gallery-top | sticky-bar). */
  product: string | null;
  /** Raw checkout layout (single-page | multi-step) the editor is drafting. */
  checkout: string | null;
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
  /** Draft custom header menu items (Customize → Header). */
  navHeader: StoreMenuItem[] | null;
  /** Draft announcement bar (Customize → Announcement bar). */
  announcement: StoreAnnouncement | null;
  /** Draft utility bar (Customize → Utility bar). */
  utilityBar: StoreUtilityBar | null;
  /** Draft campaign strip (Customize → Campaign strip). */
  campaignStrip: StoreCampaignStrip | null;
  /**
   * Draft contact launcher (Customize → WhatsApp button), already resolved by
   * the editor into the PUBLIC shape the storefront renders.
   *
   * Starts `undefined`, not `null`, and for the same reason `logo`/`banner` do:
   * `null` is a real value here — "the merchant has it switched off" — so a
   * consumer cannot `?? saved`. Turning the switch off in the editor has to
   * remove the button from the preview, not fall back to showing the saved one.
   */
  contactButton?: StoreContactButton | null;
  /** Draft footer link groups (Customize → Footer), already trimmed like the save path. */
  footerGroups: StoreFooterGroup[] | null;
  /** Draft responsive visibility of enabled checkout methods in the footer. */
  footerPaymentMethods: StoreFooterPaymentMethods | null;
  /** Draft controls for the auto content-pages footer column. */
  footerContentPages: StoreFooterContentPages | null;
  /**
   * Draft footer copy (Customize → Footer): the brand blurb, the bottom-bar
   * note, the Contact-first heading and the sign-up wording.
   *
   * All four are `null` until drafted and **empty string is a real draft** —
   * "cleared, so use the storefront's localized default" — so consumers must
   * treat `""` as a value and only fall back on `null`.
   */
  footerText: string | null;
  footerNote: string | null;
  footerContactHeading: string | null;
  footerNewsletter: StoreFooterNewsletter | null;
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
   * Draft phone artwork. `undefined`/`null` carry the same distinction the two
   * above do — `null` means the merchant removed it, so a consumer must fall
   * back to the desktop logo rather than to the SAVED mobile one.
   */
  mobileLogo?: StorefrontImage | null;
  /**
   * Draft collections from the Customize collections panel: already ordered
   * and filtered to the listed ones, with display names applied. Overrides the
   * fetched category list everywhere it's shown (header links + home chips), so
   * unsaved reordering previews live.
   */
  collections: CatalogCategory[] | null;
  /** Draft logo chrome (Customize → Brand): backdrop, height, padding, radius. */
  logoStyle: StoreLogoStyle | null;
  /** Draft homepage collections layout (Customize → Collections). */
  homeCollections: StoreHomeCollections | null;
  /**
   * Draft type family + rhythm (Customize → Design). Complete rather than
   * partial: the editor seeds every axis from `DEFAULT_DESIGN`, so a half-filled
   * object here would mean the shell had to re-resolve what the editor already knows.
   */
  design: StoreDesign | null;
  /**
   * Sample shop content for the theme picker — the previewed theme's own, so an
   * empty shop renders as that trade rather than as four blank shells. Only the
   * Themes page sends it; the Customize editor previews a real shop and leaves
   * this null. See `lib/storefront-preview-samples.ts`.
   *
   * ⚠ **Null here is the off switch, and it is the only one.** Do not gate
   * sample content on `active` instead — that flag is true for Customize and for
   * a bare `?preview=1` on a live shop, so it cannot tell "show me what this
   * theme looks like" apart from "show me my shop".
   */
  samples: ThemeSample | null;
  activate: () => void;
  apply: (patch: {
    previewDevice?: "desktop" | "mobile";
    brand?: string;
    accent?: string;
    home?: string;
    homepageSections?: StoreHomeSection[];
    sectionConfig?: StoreSectionConfig[];
    footer?: string;
    header?: string;
    heroAlign?: string;
    cardStyle?: string;
    cardActions?: string;
    imageFit?: string;
    imageRatio?: string;
    categoryTiles?: string;
    accountLayout?: string;
    contentLayout?: string;
    cartLayout?: string;
    shell?: string;
    mobile?: string;
    mobileChrome?: MobileChromeOverrides;
    pagination?: string;
    collection?: string;
    product?: string;
    checkout?: string;
    badges?: { text: string; icon?: string }[];
    heroSlides?: StoreHeroSlide[];
    heroSrc?: string;
    heroBanner?: StoreHeroBanner;
    headerMenuSrc?: string;
    navHeader?: StoreMenuItem[];
    announcement?: StoreAnnouncement;
    utilityBar?: StoreUtilityBar;
    campaignStrip?: StoreCampaignStrip;
    // `null` is meaningful (launcher switched off), so nullable in the patch.
    contactButton?: StoreContactButton | null;
    collections?: CatalogCategory[];
    footerGroups?: StoreFooterGroup[];
    footerPaymentMethods?: StoreFooterPaymentMethods;
    footerContentPages?: StoreFooterContentPages;
    footerText?: string;
    footerNote?: string;
    footerContactHeading?: string;
    footerNewsletter?: StoreFooterNewsletter;
    // `null` is meaningful (image removed), so these are nullable in the patch too.
    logo?: StorefrontImage | null;
    banner?: StorefrontImage | null;
    mobileLogo?: StorefrontImage | null;
    logoStyle?: StoreLogoStyle;
    homeCollections?: StoreHomeCollections;
    design?: StoreDesign;
    samples?: ThemeSample;
  }) => void;
}

export const useSfPreview = create<SfPreviewState>((set) => ({
  active: false,
  previewDevice: null,
  brand: null,
  accent: null,
  home: null,
  homepageSections: null,
  sectionConfig: null,
  footer: null,
  header: null,
  heroAlign: null,
  cardStyle: null,
  cardActions: null,
  imageFit: null,
  imageRatio: null,
  categoryTiles: null,
  accountLayout: null,
  contentLayout: null,
  cartLayout: null,
  shell: null,
  mobile: null,
  mobileChrome: null,
  pagination: null,
  collection: null,
  product: null,
  checkout: null,
  badges: null,
  heroSlides: null,
  heroSrc: null,
  heroBanner: null,
  headerMenuSrc: null,
  navHeader: null,
  announcement: null,
  utilityBar: null,
  campaignStrip: null,
  contactButton: undefined,
  collections: null,
  footerGroups: null,
  footerPaymentMethods: null,
  footerContentPages: null,
  footerText: null,
  footerNote: null,
  footerContactHeading: null,
  footerNewsletter: null,
  logo: undefined,
  banner: undefined,
  mobileLogo: undefined,
  logoStyle: null,
  homeCollections: null,
  design: null,
  samples: null,
  activate: () => set({ active: true }),
  apply: (patch) =>
    set((s) => ({
      previewDevice:
        patch.previewDevice !== undefined ? patch.previewDevice : s.previewDevice,
      brand: patch.brand !== undefined ? patch.brand : s.brand,
      accent: patch.accent !== undefined ? patch.accent : s.accent,
      home: patch.home !== undefined ? patch.home : s.home,
      homepageSections:
        patch.homepageSections !== undefined
          ? patch.homepageSections
          : s.homepageSections,
      sectionConfig:
        patch.sectionConfig !== undefined ? patch.sectionConfig : s.sectionConfig,
      footer: patch.footer !== undefined ? patch.footer : s.footer,
      header: patch.header !== undefined ? patch.header : s.header,
      heroAlign: patch.heroAlign !== undefined ? patch.heroAlign : s.heroAlign,
      cardStyle: patch.cardStyle !== undefined ? patch.cardStyle : s.cardStyle,
      cardActions:
        patch.cardActions !== undefined ? patch.cardActions : s.cardActions,
      imageFit: patch.imageFit !== undefined ? patch.imageFit : s.imageFit,
      imageRatio:
        patch.imageRatio !== undefined ? patch.imageRatio : s.imageRatio,
      categoryTiles:
        patch.categoryTiles !== undefined ? patch.categoryTiles : s.categoryTiles,
      accountLayout:
        patch.accountLayout !== undefined ? patch.accountLayout : s.accountLayout,
      contentLayout:
        patch.contentLayout !== undefined ? patch.contentLayout : s.contentLayout,
      cartLayout:
        patch.cartLayout !== undefined ? patch.cartLayout : s.cartLayout,
      shell: patch.shell !== undefined ? patch.shell : s.shell,
      mobile: patch.mobile !== undefined ? patch.mobile : s.mobile,
      mobileChrome:
        patch.mobileChrome !== undefined ? patch.mobileChrome : s.mobileChrome,
      pagination: patch.pagination !== undefined ? patch.pagination : s.pagination,
      collection: patch.collection !== undefined ? patch.collection : s.collection,
      product: patch.product !== undefined ? patch.product : s.product,
      checkout: patch.checkout !== undefined ? patch.checkout : s.checkout,
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
      utilityBar:
        patch.utilityBar !== undefined ? patch.utilityBar : s.utilityBar,
      campaignStrip:
        patch.campaignStrip !== undefined ? patch.campaignStrip : s.campaignStrip,
      contactButton:
        patch.contactButton !== undefined ? patch.contactButton : s.contactButton,
      collections:
        patch.collections !== undefined ? patch.collections : s.collections,
      footerGroups:
        patch.footerGroups !== undefined ? patch.footerGroups : s.footerGroups,
      footerPaymentMethods:
        patch.footerPaymentMethods !== undefined
          ? patch.footerPaymentMethods
          : s.footerPaymentMethods,
      footerContentPages:
        patch.footerContentPages !== undefined
          ? patch.footerContentPages
          : s.footerContentPages,
      footerText: patch.footerText !== undefined ? patch.footerText : s.footerText,
      footerNote: patch.footerNote !== undefined ? patch.footerNote : s.footerNote,
      footerContactHeading:
        patch.footerContactHeading !== undefined
          ? patch.footerContactHeading
          : s.footerContactHeading,
      footerNewsletter:
        patch.footerNewsletter !== undefined
          ? patch.footerNewsletter
          : s.footerNewsletter,
      logo: patch.logo !== undefined ? patch.logo : s.logo,
      banner: patch.banner !== undefined ? patch.banner : s.banner,
      mobileLogo:
        patch.mobileLogo !== undefined ? patch.mobileLogo : s.mobileLogo,
      logoStyle: patch.logoStyle !== undefined ? patch.logoStyle : s.logoStyle,
      homeCollections:
        patch.homeCollections !== undefined
          ? patch.homeCollections
          : s.homeCollections,
      design: patch.design !== undefined ? patch.design : s.design,
      samples: patch.samples !== undefined ? patch.samples : s.samples,
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
  field: "logo" | "banner" | "mobileLogo",
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
type DraftedTemplateKey =
  | "collection"
  | "product"
  | "checkout"
  | "pagination"
  | "accountLayout"
  | "contentLayout";

/**
 * One page's layout variant, with the Customize draft and the page's own
 * core-section override applied.
 *
 * **Every page that renders a `templates` variant must read it through this
 * hook, never `resolveTemplates(store)` directly** — that is what makes the
 * choice repaint while a merchant is picking it. Reading the resolver directly
 * pins the page to the SAVED value, so the picker looks broken until Save: the
 * bug this hook was generalised (from a pagination-only version) to kill.
 *
 * `override` is the core section's own setting once the page is on the builder
 * (§6: "today's `templates.*` layout choice becomes that core section's `layout`
 * setting"). It is a RAW template id, the same vocabulary the merchant's
 * settings store — so it is merged into `templates` and resolved with them
 * rather than translated here, and a section and the Site say the same thing the
 * same way.
 *
 * Precedence: **Customize draft → the section's override → the store's
 * template**, which is `cart-lines`' rule. The draft sits on top because a
 * merchant dragging a Customize control has to see it move; the override sits
 * over the store because choosing one is opting this page out of the Site value.
 */
export const useStoreTemplate = <K extends DraftedTemplateKey>(
  store: Pick<StorefrontStore, "templates"> | null | undefined,
  key: K,
  override?: string,
): StoreTemplates[K] => {
  const draft = useSfPreview((s) => s[key]);
  const templates: StoreTemplatesRaw = { ...store?.templates };
  if (override) templates[key] = override;
  if (draft) templates[key] = draft;
  return resolveTemplates({ templates })[key];
};
