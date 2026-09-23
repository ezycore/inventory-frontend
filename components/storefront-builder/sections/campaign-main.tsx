// coding-standard: maintained
import type { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import type { SectionViewProps } from "@/components/storefront-builder/section-view";
import { CampaignFromRoute } from "@/components/storefront/collection/collection-data";

type Spec = (typeof SECTION_SPECS)["campaign-main"]["settings"];

/**
 * A sale's banner and the products it discounts — the core section of a campaign
 * page, at the campaign's own address.
 *
 * Which campaign comes from the ROUTE, never from a setting: the page belongs to
 * one campaign, and that address is the link the merchant has already shared.
 * The first page of results is seeded server-side, so the grid is real HTML for
 * a shopper arriving from an ad.
 *
 * Without this section's page the same address draws exactly this — the page is
 * opt-in, and starting it with anything else would make opting in a downgrade.
 */
export function CampaignMainSection({ settings }: SectionViewProps<Spec>) {
  return (
    <div className="sfb-core">
      <CampaignFromRoute
        layout={settings.layout}
        pagination={settings.pagination}
        hideBanner={settings.hideBanner}
      />
    </div>
  );
}
