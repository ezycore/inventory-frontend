// coding-standard: maintained
import type { ComponentType, ReactNode } from "react";
import type { SectionFieldSpec, SectionPageContext } from "@/lib/storefront-builder/field-specs";
import { SECTION_SPECS, type SectionType } from "@/lib/storefront-builder/section-specs";
import {
  productSectionRequest,
  type ProductsDataRequest,
  type SectionData,
  type StoreListNeed,
} from "@/lib/storefront-builder/section-data";
import { readBlocks, readSettings, type SettingsOf } from "@/lib/storefront-builder/settings";
import type { FrameDefaults } from "@/lib/storefront-builder/section-style";
import { offerCampaigns, pickByIds, sectionCategories } from "@/lib/storefront-builder/store-lists";
import { parseVideoEmbed } from "@/lib/storefront-builder/video-embed";
import { parseRichDoc } from "@/lib/storefront-rich-doc";
import type { SectionContext, SectionViewProps } from "@/components/storefront-builder/section-view";
import { sectionProduct } from "@/components/storefront-builder/section-product";
import { BenefitsSection } from "@/components/storefront-builder/sections/benefits";
import { CallToActionSection } from "@/components/storefront-builder/sections/call-to-action";
import { CampaignOffersSection } from "@/components/storefront-builder/sections/campaign-offers";
import {
  CategoryPromoCardsSection,
  promoCards,
} from "@/components/storefront-builder/sections/category-promo-cards";
import { CategoryTilesSection } from "@/components/storefront-builder/sections/category-tiles";
import { ContentBodySection } from "@/components/storefront-builder/sections/content-body";
import { CartLinesSection } from "@/components/storefront-builder/sections/cart-lines";
import { CheckoutFormSection } from "@/components/storefront-builder/sections/checkout-form";
import { AccountAreaSection } from "@/components/storefront-builder/sections/account-area";
import { SearchResultsSection } from "@/components/storefront-builder/sections/search-results";
import { CampaignMainSection } from "@/components/storefront-builder/sections/campaign-main";
import { CollectionGridSection } from "@/components/storefront-builder/sections/collection-grid";
import { ProductMainSection } from "@/components/storefront-builder/sections/product-main";
import { RelatedProductsSection } from "@/components/storefront-builder/sections/related-products";
import { CollectionsRowSection } from "@/components/storefront-builder/sections/collections-row";
import { FaqSection } from "@/components/storefront-builder/sections/faq";
import { GallerySection } from "@/components/storefront-builder/sections/gallery";
import { HeroSection, heroSlides, keepsEmptySlides } from "@/components/storefront-builder/sections/hero";
import { HowToOrderSection } from "@/components/storefront-builder/sections/how-to-order";
import { ImageBannerSection } from "@/components/storefront-builder/sections/image-banner";
import { ImageTextSection } from "@/components/storefront-builder/sections/image-text";
import { OfferPricingSection } from "@/components/storefront-builder/sections/offer-pricing";
import { OrderFormSection } from "@/components/storefront-builder/sections/order-form";
import { ProductCarouselSection } from "@/components/storefront-builder/sections/product-carousel";
import { ProductGridSection } from "@/components/storefront-builder/sections/product-grid";
import {
  productRowNeedsCategories,
  type ProductRowWording,
} from "@/components/storefront-builder/product-row-heading";
import { PromisesBandSection } from "@/components/storefront-builder/sections/promises-band";
import { RichTextSection } from "@/components/storefront-builder/sections/rich-text";
import { SelectedProductsSection } from "@/components/storefront-builder/sections/selected-products";
import { ShopByTagSection } from "@/components/storefront-builder/sections/shop-by-tag";
import { SpacerSection } from "@/components/storefront-builder/sections/spacer";
import { SingleProductSection } from "@/components/storefront-builder/sections/single-product";
import { StickyOrderBarSection } from "@/components/storefront-builder/sections/sticky-order-bar";
import {
  TestimonialsSection,
  shownTestimonials,
} from "@/components/storefront-builder/sections/testimonials";
import { VideoSection } from "@/components/storefront-builder/sections/video";

/** A section instance whose settings have been read and found renderable. */
export interface PreparedSection {
  /** The catalogue query this instance needs, if any. */
  request: ProductsDataRequest | null;
  /** Store-wide lists this instance reads from the page context. */
  needs: readonly StoreListNeed[];
  /** True when, given its data and the page context, the section would draw nothing. */
  isEmpty: (data: SectionData | undefined, context: SectionContext) => boolean;
  /** Pinned to the screen rather than placed in the page flow — its frame takes no room. */
  floating: boolean;
  /** The type's own frame where the instance's style box sets nothing. */
  frame?: FrameDefaults;
  render: (context: SectionContext, data: SectionData | undefined) => ReactNode;
}

export interface RenderableSection {
  v: number;
  /**
   * `null` when a required setting does not read — the page skips the instance.
   * `page` is the page it sits on, when the caller knows it: a setting that page
   * supplies itself (`fromPage`) is then not required.
   */
  prepare: (
    instance: { id: string; settings: unknown; blocks?: unknown },
    page?: SectionPageContext,
  ) => PreparedSection | null;
}

interface SectionOptions<S extends Record<string, SectionFieldSpec>, B extends Record<string, SectionFieldSpec>> {
  /**
   * The catalogue query this section makes. Returning `null` means there is
   * nothing to query, and the instance is not rendered.
   */
  request?: (id: string, settings: SettingsOf<S>) => ProductsDataRequest | null;
  /**
   * The section is about one product, which a product page supplies itself: when
   * `request` has nothing to ask for (no product named), the instance still
   * renders and reads `context.product`.
   */
  pageProduct?: boolean;
  /**
   * Store-wide lists the view reads (`context.categories`, `context.tags`,
   * `context.campaigns`). The page fetches each list once, and only when some
   * section on it asks — a function when only some settings read one.
   */
  needs?: readonly StoreListNeed[] | ((settings: SettingsOf<S>) => readonly StoreListNeed[]);
  isEmpty?: (
    settings: SettingsOf<S>,
    blocks: { id: string; settings: SettingsOf<B> }[],
    data: SectionData | undefined,
    context: SectionContext,
  ) => boolean;
  /** The view pins itself to the screen, so its frame's padding and background never show. */
  floating?: boolean;
  /**
   * The padding, band and width this section type has when its style box sets
   * nothing. Unset is the common `md` frame.
   */
  frame?:
    | FrameDefaults
    | ((settings: SettingsOf<S>, blocks: { id: string; settings: SettingsOf<B> }[]) => FrameDefaults);
}

/**
 * Binds a spec to its view. Everything typed about a section — its settings, its
 * blocks, its data request — is checked here, once, and erased behind
 * `RenderableSection`, so the page renderer walks a mixed list without casts.
 */
function defineSection<
  S extends Record<string, SectionFieldSpec>,
  B extends Record<string, SectionFieldSpec> = Record<string, never>,
>(
  definition: { v: number; settings: S; blocks?: { max: number; settings: B } },
  View: ComponentType<SectionViewProps<S, B>>,
  options: SectionOptions<S, B> = {},
): RenderableSection {
  return {
    v: definition.v,
    prepare(instance, page) {
      const settings = readSettings(definition.settings, instance.settings, page);
      if (!settings) return null;
      const blocks = readBlocks(definition.blocks, instance.blocks, page);
      let request: ProductsDataRequest | null = null;
      if (options.request) {
        request = options.request(instance.id, settings);
        if (!request && !options.pageProduct) return null;
      }
      return {
        request,
        needs: typeof options.needs === "function" ? options.needs(settings) : (options.needs ?? []),
        isEmpty: (data, context) => options.isEmpty?.(settings, blocks, data, context) ?? false,
        floating: options.floating ?? false,
        frame: typeof options.frame === "function" ? options.frame(settings, blocks) : options.frame,
        render: (context, data) => (
          <View id={instance.id} settings={settings} blocks={blocks} context={context} data={data} />
        ),
      };
    },
  };
}

const noProducts = (_settings: unknown, _blocks: unknown, data: SectionData | undefined) =>
  !data?.items.length;

/** A product row fetches the category tree only when it names itself after, or links to, its collection. */
const productRowNeeds = (settings: ProductRowWording): readonly StoreListNeed[] =>
  productRowNeedsCategories(settings) ? ["categories"] : [];

/**
 * The home-page section types' own vertical padding. Their side padding is the
 * frame's `--pad` already.
 */
const even = (padding: string): FrameDefaults => ({ top: padding, bottom: padding });
const HOME_FRAMES = {
  /* Every hero frame owns its alignment: the hero's own Alignment control, on
     the Content tab, is the only thing that moves hero text (plan phase 5). */
  heroCard: { ...even("var(--pad)"), ownsAlign: true },
  heroOpen: { top: "clamp(28px,5vw,64px)", bottom: "clamp(20px,3vw,40px)", ownsAlign: true },
  /* And its width: "Full width" is already what the Layout control calls this
     hero, so the Style tab offering a second "Full width" — which won, and could
     box an edge-to-edge hero into the page column — was two levers on one
     decision. `field-visibility.ts` hides that control for this layout; this is
     the other half, without which the stored value would keep applying. */
  heroFullBleed: { top: "0px", bottom: "0px", width: "full", ownsAlign: true, ownsWidth: true },
  row: { top: "clamp(16px,3vw,28px)", bottom: "8px" },
  tiles: even("clamp(16px,3vw,28px)"),
} satisfies Record<string, FrameDefaults>;

/**
 * The one product a section is about, asked for by id. A hand-picked product is
 * returned whatever its stock, so a sold-out offer says so instead of vanishing
 * from the page an ad points at. Nothing to ask for on the product page, which
 * supplies its own (`pageProduct`).
 */
const oneProduct = (id: string, settings: { productId?: string }): ProductsDataRequest | null =>
  settings.productId
    ? { key: id, type: "products", source: "manual", productIds: [settings.productId], limit: 1 }
    : null;

const noSectionProduct = (_settings: unknown, _blocks: unknown, data: SectionData | undefined, context: SectionContext) =>
  !sectionProduct(data, context);

/**
 * Every section type this build renders. A type missing here is skipped on the
 * page rather than breaking it.
 *
 * The home page's sections arrive here as builder sections (plan §8):
 * `promises-band` (trust band), `image-text` (editorial split), `shop-by-tag`
 * (tag chips), `collections-row` (collection chips and links),
 * `selected-products` (minimal picks), `product-carousel` (product rail),
 * `campaign-offers` (deal strip), `category-tiles` and `category-promo-cards`
 * (category banners), and `hero` (card, open and full-bleed heroes, slides as
 * blocks); `product-grid` replaced the featured grid.
 *
 * `countdown` is specified but not rendered yet: its labels (days, hours,
 * minutes, seconds) have no Bangla terms in `docs/I18N-GLOSSARY.md`, and
 * storefront copy must not invent them.
 */
export const SECTION_REGISTRY: Partial<Record<SectionType, RenderableSection>> = {
  hero: defineSection(SECTION_SPECS.hero, HeroSection, {
    /* The running offer is drawn by the card and open heroes only — the
       full-bleed branch has never carried a badge, and its control is hidden
       there. Without the layout half, a full-bleed hero that still had the flag
       stored from another layout fetched the store's campaigns on every render
       to decide nothing. */
    needs: (settings) =>
      settings.campaignBadge && settings.layout !== "full-bleed" ? ["campaigns"] : [],
    isEmpty: (settings, blocks) => heroSlides(blocks, keepsEmptySlides(settings)).length === 0,
    /* The frame follows the LAYOUT, and nothing else. It used to give the open
       hero its own spacing only while the hero had a single slide, because a
       second slide turned it into the framed carousel; since phase 3 an open
       hero stays open however many slides it has, so tying its padding to the
       slide count would move the section's edges as the merchant adds one. */
    frame: (settings) =>
      settings.layout === "full-bleed"
        ? HOME_FRAMES.heroFullBleed
        : settings.layout === "open"
          ? HOME_FRAMES.heroOpen
          : HOME_FRAMES.heroCard,
  }),
  "rich-text": defineSection(SECTION_SPECS["rich-text"], RichTextSection, {
    isEmpty: (settings) => parseRichDoc(settings.body) === null,
  }),
  "content-body": defineSection(SECTION_SPECS["content-body"], ContentBodySection, {
    // The frame draws the title even when the body is empty, as the page always did.
    frame: { top: "0px", bottom: "0px", width: "full" },
  }),
  "cart-lines": defineSection(SECTION_SPECS["cart-lines"], CartLinesSection, {
    // The cart brings its own page padding and column, exactly as the route
    // drew it — the section must add none, or a moved cart sits lower on the
    // page than the cart it replaced. Same rule as `content-body`.
    frame: { top: "0px", bottom: "0px", width: "full" },
  }),
  "checkout-form": defineSection(SECTION_SPECS["checkout-form"], CheckoutFormSection, {
    frame: { top: "0px", bottom: "0px", width: "full" },
  }),
  "account-area": defineSection(SECTION_SPECS["account-area"], AccountAreaSection, {
    frame: { top: "0px", bottom: "0px", width: "full" },
  }),
  "search-results": defineSection(SECTION_SPECS["search-results"], SearchResultsSection, {
    frame: { top: "0px", bottom: "0px", width: "full" },
  }),
  "collection-grid": defineSection(SECTION_SPECS["collection-grid"], CollectionGridSection, {
    frame: { top: "0px", bottom: "0px", width: "full" },
  }),
  "campaign-main": defineSection(SECTION_SPECS["campaign-main"], CampaignMainSection, {
    frame: { top: "0px", bottom: "0px", width: "full" },
  }),
  "product-main": defineSection(SECTION_SPECS["product-main"], ProductMainSection, {
    frame: { top: "0px", bottom: "0px", width: "full" },
  }),
  "related-products": defineSection(SECTION_SPECS["related-products"], RelatedProductsSection, {
    isEmpty: (_settings, _blocks, _data, context) => !context.product,
  }),
  faq: defineSection(SECTION_SPECS.faq, FaqSection, {
    isEmpty: (_settings, blocks) => blocks.length === 0,
  }),
  "call-to-action": defineSection(SECTION_SPECS["call-to-action"], CallToActionSection),
  "order-form": defineSection(SECTION_SPECS["order-form"], OrderFormSection, {
    request: oneProduct,
    pageProduct: true,
    isEmpty: noSectionProduct,
  }),
  "single-product": defineSection(SECTION_SPECS["single-product"], SingleProductSection, {
    request: oneProduct,
    isEmpty: noProducts,
  }),
  "offer-pricing": defineSection(SECTION_SPECS["offer-pricing"], OfferPricingSection, {
    request: oneProduct,
    pageProduct: true,
    isEmpty: noSectionProduct,
  }),
  "sticky-order-bar": defineSection(SECTION_SPECS["sticky-order-bar"], StickyOrderBarSection, {
    request: oneProduct,
    pageProduct: true,
    isEmpty: noSectionProduct,
    floating: true,
  }),
  testimonials: defineSection(SECTION_SPECS.testimonials, TestimonialsSection, {
    isEmpty: (_settings, blocks) => shownTestimonials(blocks).length === 0,
  }),
  benefits: defineSection(SECTION_SPECS.benefits, BenefitsSection, {
    isEmpty: (_settings, blocks) => blocks.length === 0,
  }),
  "how-to-order": defineSection(SECTION_SPECS["how-to-order"], HowToOrderSection, {
    isEmpty: (_settings, blocks) => blocks.length === 0,
  }),
  video: defineSection(SECTION_SPECS.video, VideoSection, {
    isEmpty: (settings) => parseVideoEmbed(settings.url) === null,
  }),
  "image-banner": defineSection(SECTION_SPECS["image-banner"], ImageBannerSection),
  gallery: defineSection(SECTION_SPECS.gallery, GallerySection, {
    isEmpty: (_settings, blocks) => blocks.length === 0,
  }),
  // No padding of its own: the band's height is the merchant's number, exactly.
  spacer: defineSection(SECTION_SPECS.spacer, SpacerSection, {
    frame: { top: "0px", bottom: "0px" },
  }),
  "product-grid": defineSection(SECTION_SPECS["product-grid"], ProductGridSection, {
    request: productSectionRequest,
    needs: productRowNeeds,
    isEmpty: noProducts,
    frame: even("22px"),
  }),
  "promises-band": defineSection(SECTION_SPECS["promises-band"], PromisesBandSection, {
    isEmpty: (settings, blocks, _data, context) =>
      settings.storePromises ? !context.trustBadges?.length : blocks.length === 0,
    frame: { ...even("clamp(13px,1.8vw,19px)"), band: "accent-soft" },
  }),
  "image-text": defineSection(SECTION_SPECS["image-text"], ImageTextSection, {
    frame: even("clamp(28px,5vw,56px)"),
  }),
  "shop-by-tag": defineSection(SECTION_SPECS["shop-by-tag"], ShopByTagSection, {
    needs: ["tags"],
    isEmpty: (settings, _blocks, _data, context) =>
      pickByIds(context.tags ?? [], settings.tagIds).length === 0,
    frame: HOME_FRAMES.row,
  }),
  "collections-row": defineSection(SECTION_SPECS["collections-row"], CollectionsRowSection, {
    needs: ["categories"],
    isEmpty: (settings, _blocks, _data, context) =>
      sectionCategories(context.categories ?? [], settings.categoryIds).length === 0,
    // Plain links sit under the row above them, with room to breathe below.
    frame: (settings) =>
      settings.style === "plain" ? { top: "0px", bottom: "clamp(40px,6vw,64px)" } : HOME_FRAMES.row,
  }),
  "selected-products": defineSection(SECTION_SPECS["selected-products"], SelectedProductsSection, {
    request: productSectionRequest,
    needs: productRowNeeds,
    isEmpty: noProducts,
    frame: { top: "0px", bottom: "clamp(48px,7vw,80px)" },
  }),
  "product-carousel": defineSection(SECTION_SPECS["product-carousel"], ProductCarouselSection, {
    request: productSectionRequest,
    needs: productRowNeeds,
    isEmpty: noProducts,
    frame: { ...even("clamp(20px,3vw,32px)"), band: "surface" },
  }),
  "campaign-offers": defineSection(SECTION_SPECS["campaign-offers"], CampaignOffersSection, {
    needs: ["campaigns"],
    isEmpty: (_settings, _blocks, _data, context) =>
      offerCampaigns(context.campaigns ?? []).length === 0,
    frame: even("clamp(12px,2vw,20px)"),
  }),
  "category-tiles": defineSection(SECTION_SPECS["category-tiles"], CategoryTilesSection, {
    needs: ["categories"],
    isEmpty: (settings, _blocks, _data, context) =>
      sectionCategories(context.categories ?? [], settings.categoryIds).length === 0,
    frame: HOME_FRAMES.tiles,
  }),
  "category-promo-cards": defineSection(SECTION_SPECS["category-promo-cards"], CategoryPromoCardsSection, {
    needs: ["categories"],
    isEmpty: (_settings, blocks, _data, context) =>
      promoCards(context.categories ?? [], blocks).length === 0,
    frame: HOME_FRAMES.tiles,
  }),
};
