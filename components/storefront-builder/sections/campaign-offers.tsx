// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { offerCampaigns } from "@/lib/storefront-builder/store-lists";
import { Island } from "@/components/storefront-builder/islands/island-map";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";

type Spec = (typeof SECTION_SPECS)["campaign-offers"]["settings"];

/**
 * The store's running campaigns as swipeable offer cards: the home page's deal
 * strip as a section. Campaign-fed, never merchant-typed, so the section
 * disappears the day the last campaign ends.
 *
 * The heading is the merchant's. The card wording ("off", "Ends") and the
 * arrows' names are the shopper's interface language, which a cached server
 * view cannot know — the island reads it.
 */
export function CampaignOffersSection({ settings, context }: SectionViewProps<Spec>) {
  const campaigns = offerCampaigns(context.campaigns ?? []);
  if (campaigns.length === 0) return null;
  /* Trimmed, like every other section that offers a heading beside the store's
     own wording (`ShopByTagSection`). Untrimmed, a heading of spaces counted as
     the merchant's: it suppressed the store's wording AND drew an empty `<h2>`,
     so the row lost its title to a field that looks empty in the editor. */
  const heading = settings.heading?.trim() || undefined;
  return (
    <Island
      name="campaign-offers"
      props={{
        base: context.base,
        campaigns,
        currency: context.currency,
        heading,
        headingWord: heading ? undefined : settings.storeHeading,
      }}
    />
  );
}
