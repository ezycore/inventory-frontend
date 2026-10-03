// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { CatalogCategory, StoreSectionCard } from "@/lib/storefront-client";
import type { SettingsOf } from "@/lib/storefront-builder/settings";
import { findSectionCategory } from "@/lib/storefront-sections";
import { SectionTitle } from "@/components/storefront/sf-bits";
import {
  CategoryBannerRow,
  type BannerRowConfig,
} from "@/components/storefront/home/category-banner-row";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["category-promo-cards"];
type Settings = SettingsOf<Spec["settings"]>;
type CardBlock = { id: string; settings: SettingsOf<Spec["blocks"]["settings"]> };

/**
 * Each card's collection, in block order. A card whose collection is gone, or
 * repeats one already shown, is skipped.
 */
export function promoCards(
  categories: CatalogCategory[],
  blocks: readonly CardBlock[],
): { category: CatalogCategory; card: StoreSectionCard }[] {
  const seen = new Set<string>();
  return blocks.flatMap(({ settings }) => {
    const found = findSectionCategory(categories, settings.categoryId);
    if (!found || seen.has(found.category._id)) return [];
    seen.add(found.category._id);
    return [
      {
        category: found.category,
        card: {
          categoryId: found.category._id,
          title: settings.title,
          description: settings.description,
          image: settings.image,
          buttonLabel: settings.buttonLabel,
          buttonHref: settings.buttonHref,
        },
      },
    ];
  });
}

/**
 * The section's settings in the home promo row's vocabulary. A responsive
 * setting's `base` is the desktop answer and its `mobile` the phone's, which
 * `resolveBannerLayout` already inherits from the desktop when unset.
 */
const bannerConfig = (settings: Settings, cards: StoreSectionCard[]): BannerRowConfig => ({
  cardShape: settings.shape?.base,
  cardSide: settings.side?.base,
  cardSplit: settings.split?.base,
  cardHideText: settings.hideText?.base,
  cardHeight: settings.height?.base,
  cardFlow: settings.flow?.base,
  cardPerRow: settings.perRow?.base,
  cardRatio: settings.ratio,
  cardRadius: settings.radius,
  cardArrows: settings.arrows,
  cards,
  mobile: {
    cardShape: settings.shape?.mobile,
    cardSide: settings.side?.mobile,
    cardSplit: settings.split?.mobile,
    cardHideText: settings.hideText?.mobile,
    cardHeight: settings.height?.mobile,
    cardFlow: settings.flow?.mobile,
    cardPerRow: settings.perRow?.mobile,
  },
});

/**
 * One to four collections advertised large, each with a photo, the merchant's
 * line about it and a button: the home page's category promo cards as a
 * section. Each block is a card; its words and photo override the collection's
 * for this card only. A card shows a button only when the merchant wrote one —
 * or, under `storeWords`, always, worded "Shop now" in the shopper's language until the merchant writes their own.
 */
export function CategoryPromoCardsSection({
  settings,
  blocks,
  context,
}: SectionViewProps<Spec["settings"], Spec["blocks"]["settings"]>) {
  const cards = promoCards(context.categories ?? [], blocks);
  if (cards.length === 0) return null;
  return (
    <>
      {settings.heading ? <SectionTitle>{settings.heading}</SectionTitle> : null}
      <CategoryBannerRow
        base={context.base}
        categories={cards.map(({ category }) => category)}
        config={bannerConfig(settings, cards.map(({ card }) => card))}
        defaultButtonLabel={settings.storeWords ? <Island name="store-word" props={{ word: "shopNow" }} /> : undefined}
        imageFit={context.imageFit ?? "cover"}
        renderStrip={(strip) => <Island name="category-strip" props={strip} />}
      />
    </>
  );
}
