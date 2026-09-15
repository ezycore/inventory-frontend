// coding-standard: maintained
import type { ComponentType, ReactNode } from "react";
import type { SectionFieldSpec } from "@/lib/storefront-builder/field-specs";
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
import { BenefitsSection } from "@/components/storefront-builder/sections/benefits";
import { CallToActionSection } from "@/components/storefront-builder/sections/call-to-action";
import { CampaignOffersSection } from "@/components/storefront-builder/sections/campaign-offers";
import {
  CategoryPromoCardsSection,
  promoCards,
} from "@/components/storefront-builder/sections/category-promo-cards";
import { CategoryTilesSection } from "@/components/storefront-builder/sections/category-tiles";
import { CollectionsRowSection } from "@/components/storefront-builder/sections/collections-row";
import { FaqSection } from "@/components/storefront-builder/sections/faq";
import { HeroSection, heroSlides } from "@/components/storefront-builder/sections/hero";
import { HowToOrderSection } from "@/components/storefront-builder/sections/how-to-order";
import { ImageTextSection } from "@/components/storefront-builder/sections/image-text";
import { OfferPricingSection } from "@/components/storefront-builder/sections/offer-pricing";
import { OrderFormSection } from "@/components/storefront-builder/sections/order-form";
import { ProductCarouselSection } from "@/components/storefront-builder/sections/product-carousel";
import { ProductGridSection } from "@/components/storefront-builder/sections/product-grid";
import { PromisesBandSection } from "@/components/storefront-builder/sections/promises-band";
import { RichTextSection } from "@/components/storefront-builder/sections/rich-text";
import { SelectedProductsSection } from "@/components/storefront-builder/sections/selected-products";
import { ShopByTagSection } from "@/components/storefront-builder/sections/shop-by-tag";
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
  /** `null` when a required setting does not read — the page skips the instance. */
  prepare: (instance: { id: string; settings: unknown; blocks?: unknown }) => PreparedSection | null;
}

interface SectionOptions<S extends Record<string, SectionFieldSpec>, B extends Record<string, SectionFieldSpec>> {
  /**
   * The catalogue query this section makes. Returning `null` means there is
   * nothing to query, and the instance is not rendered.
   */
  request?: (id: string, settings: SettingsOf<S>) => ProductsDataRequest | null;
  /**
   * Store-wide lists the view reads (`context.categories`, `context.tags`,
   * `context.campaigns`). The page fetches each list once, and only when some
   * section on it asks.
   */
  needs?: readonly StoreListNeed[];
  isEmpty?: (
    settings: SettingsOf<S>,
    blocks: { id: string; settings: SettingsOf<B> }[],
    data: SectionData | undefined,
    context: SectionContext,
  ) => boolean;
  /** The view pins itself to the screen, so its frame's padding and background never show. */
  floating?: boolean;
  /**
   * The padding, band and width this section has on the classic home page, so a
   * home moved onto the builder keeps its spacing. Unset is the common `md` frame.
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
    prepare(instance) {
      const settings = readSettings(definition.settings, instance.settings);
      if (!settings) return null;
      const blocks = readBlocks(definition.blocks, instance.blocks);
      let request: ProductsDataRequest | null = null;
      if (options.request) {
        request = options.request(instance.id, settings);
        if (!request) return null;
      }
      return {
        request,
        needs: options.needs ?? [],
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

/**
 * The classic home sections' own vertical padding (`components/storefront/home/sections`).
 * Their side padding is the frame's `--pad` already.
 */
const even = (padding: string): FrameDefaults => ({ top: padding, bottom: padding });
const HOME_FRAMES = {
  heroCard: even("var(--pad)"),
  heroOpen: { top: "clamp(28px,5vw,64px)", bottom: "clamp(20px,3vw,40px)" },
  heroFullBleed: { top: "0px", bottom: "0px", width: "full" },
  row: { top: "clamp(16px,3vw,28px)", bottom: "8px" },
  tiles: even("clamp(16px,3vw,28px)"),
} satisfies Record<string, FrameDefaults>;

/**
 * The one product a section is about, asked for by id. A hand-picked product is
 * returned whatever its stock, so a sold-out offer says so instead of vanishing
 * from the page an ad points at.
 */
const oneProduct = (id: string, settings: { productId: string }): ProductsDataRequest => ({
  key: id,
  type: "products",
  source: "manual",
  productIds: [settings.productId],
  limit: 1,
});

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
    isEmpty: (_settings, blocks) => heroSlides(blocks).length === 0,
    // Slides rotate in a card spaced like the framed hero; only one open slide is the open hero.
    frame: (settings, blocks) =>
      settings.layout === "full-bleed"
        ? HOME_FRAMES.heroFullBleed
        : settings.layout === "open" && heroSlides(blocks).length === 1
          ? HOME_FRAMES.heroOpen
          : HOME_FRAMES.heroCard,
  }),
  "rich-text": defineSection(SECTION_SPECS["rich-text"], RichTextSection, {
    isEmpty: (settings) => parseRichDoc(settings.body) === null,
  }),
  faq: defineSection(SECTION_SPECS.faq, FaqSection, {
    isEmpty: (_settings, blocks) => blocks.length === 0,
  }),
  "call-to-action": defineSection(SECTION_SPECS["call-to-action"], CallToActionSection),
  "order-form": defineSection(SECTION_SPECS["order-form"], OrderFormSection, {
    request: oneProduct,
    isEmpty: noProducts,
  }),
  "single-product": defineSection(SECTION_SPECS["single-product"], SingleProductSection, {
    request: oneProduct,
    isEmpty: noProducts,
  }),
  "offer-pricing": defineSection(SECTION_SPECS["offer-pricing"], OfferPricingSection, {
    request: oneProduct,
    isEmpty: noProducts,
  }),
  "sticky-order-bar": defineSection(SECTION_SPECS["sticky-order-bar"], StickyOrderBarSection, {
    request: oneProduct,
    isEmpty: noProducts,
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
  "product-grid": defineSection(SECTION_SPECS["product-grid"], ProductGridSection, {
    request: productSectionRequest,
    isEmpty: noProducts,
    frame: even("22px"),
  }),
  "promises-band": defineSection(SECTION_SPECS["promises-band"], PromisesBandSection, {
    isEmpty: (_settings, blocks) => blocks.length === 0,
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
    isEmpty: noProducts,
    frame: { top: "0px", bottom: "clamp(48px,7vw,80px)" },
  }),
  "product-carousel": defineSection(SECTION_SPECS["product-carousel"], ProductCarouselSection, {
    request: productSectionRequest,
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
