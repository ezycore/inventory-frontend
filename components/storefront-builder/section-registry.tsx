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
import { offerCampaigns, pickByIds, sectionCategories } from "@/lib/storefront-builder/store-lists";
import { parseRichDoc } from "@/lib/storefront-rich-doc";
import type { SectionContext, SectionViewProps } from "@/components/storefront-builder/section-view";
import { CallToActionSection } from "@/components/storefront-builder/sections/call-to-action";
import { CampaignOffersSection } from "@/components/storefront-builder/sections/campaign-offers";
import {
  CategoryPromoCardsSection,
  promoCards,
} from "@/components/storefront-builder/sections/category-promo-cards";
import { CategoryTilesSection } from "@/components/storefront-builder/sections/category-tiles";
import { CollectionsRowSection } from "@/components/storefront-builder/sections/collections-row";
import { FaqSection } from "@/components/storefront-builder/sections/faq";
import { ImageTextSection } from "@/components/storefront-builder/sections/image-text";
import { ProductCarouselSection } from "@/components/storefront-builder/sections/product-carousel";
import { ProductGridSection } from "@/components/storefront-builder/sections/product-grid";
import { PromisesBandSection } from "@/components/storefront-builder/sections/promises-band";
import { RichTextSection } from "@/components/storefront-builder/sections/rich-text";
import { SelectedProductsSection } from "@/components/storefront-builder/sections/selected-products";
import { ShopByTagSection } from "@/components/storefront-builder/sections/shop-by-tag";

/** A section instance whose settings have been read and found renderable. */
export interface PreparedSection {
  /** The catalogue query this instance needs, if any. */
  request: ProductsDataRequest | null;
  /** Store-wide lists this instance reads from the page context. */
  needs: readonly StoreListNeed[];
  /** True when, given its data and the page context, the section would draw nothing. */
  isEmpty: (data: SectionData | undefined, context: SectionContext) => boolean;
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
 * Every section type this build renders. A type missing here is skipped on the
 * page rather than breaking it.
 *
 * The home page's sections arrive here as builder sections (plan §8):
 * `promises-band` (trust band), `image-text` (editorial split), `shop-by-tag`
 * (tag chips), `collections-row` (collection chips and links),
 * `selected-products` (minimal picks), `product-carousel` (product rail),
 * `campaign-offers` (deal strip), `category-tiles` and `category-promo-cards`
 * (category banners); `product-grid` replaced the featured grid. The hero is
 * still to come.
 *
 * `countdown` is specified but not rendered yet: its labels (days, hours,
 * minutes, seconds) have no Bangla terms in `docs/I18N-GLOSSARY.md`, and
 * storefront copy must not invent them.
 */
export const SECTION_REGISTRY: Partial<Record<SectionType, RenderableSection>> = {
  "rich-text": defineSection(SECTION_SPECS["rich-text"], RichTextSection, {
    isEmpty: (settings) => parseRichDoc(settings.body) === null,
  }),
  faq: defineSection(SECTION_SPECS.faq, FaqSection, {
    isEmpty: (_settings, blocks) => blocks.length === 0,
  }),
  "call-to-action": defineSection(SECTION_SPECS["call-to-action"], CallToActionSection),
  "product-grid": defineSection(SECTION_SPECS["product-grid"], ProductGridSection, {
    request: productSectionRequest,
    isEmpty: noProducts,
  }),
  "promises-band": defineSection(SECTION_SPECS["promises-band"], PromisesBandSection, {
    isEmpty: (_settings, blocks) => blocks.length === 0,
  }),
  "image-text": defineSection(SECTION_SPECS["image-text"], ImageTextSection),
  "shop-by-tag": defineSection(SECTION_SPECS["shop-by-tag"], ShopByTagSection, {
    needs: ["tags"],
    isEmpty: (settings, _blocks, _data, context) =>
      pickByIds(context.tags ?? [], settings.tagIds).length === 0,
  }),
  "collections-row": defineSection(SECTION_SPECS["collections-row"], CollectionsRowSection, {
    needs: ["categories"],
    isEmpty: (settings, _blocks, _data, context) =>
      sectionCategories(context.categories ?? [], settings.categoryIds).length === 0,
  }),
  "selected-products": defineSection(SECTION_SPECS["selected-products"], SelectedProductsSection, {
    request: productSectionRequest,
    isEmpty: noProducts,
  }),
  "product-carousel": defineSection(SECTION_SPECS["product-carousel"], ProductCarouselSection, {
    request: productSectionRequest,
    isEmpty: noProducts,
  }),
  "campaign-offers": defineSection(SECTION_SPECS["campaign-offers"], CampaignOffersSection, {
    needs: ["campaigns"],
    isEmpty: (_settings, _blocks, _data, context) =>
      offerCampaigns(context.campaigns ?? []).length === 0,
  }),
  "category-tiles": defineSection(SECTION_SPECS["category-tiles"], CategoryTilesSection, {
    needs: ["categories"],
    isEmpty: (settings, _blocks, _data, context) =>
      sectionCategories(context.categories ?? [], settings.categoryIds).length === 0,
  }),
  "category-promo-cards": defineSection(SECTION_SPECS["category-promo-cards"], CategoryPromoCardsSection, {
    needs: ["categories"],
    isEmpty: (_settings, blocks, _data, context) =>
      promoCards(context.categories ?? [], blocks).length === 0,
  }),
};
