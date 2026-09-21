"use client";
// coding-standard: maintained

import type { StoreCampaignDetail } from "@/lib/storefront-client";
import type { Dict } from "@/lib/storefront-i18n";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  campaignEndsLabel,
  campaignStartsLabel,
} from "@/lib/storefront-campaign-date";
import { money } from "@/components/storefront/format";
import { Icon } from "@/components/storefront/sf-icons";

/**
 * The banner at the top of a campaign's own page (`/campaigns/<slug>`).
 *
 * This page exists because a campaign had no address. A merchant who picks
 * twenty products out of eight categories got a sale that the storefront priced
 * correctly and that they could not link anyone to — every campaign CTA fell
 * back to `/products`, the whole catalogue, with nothing marking which twenty
 * things were actually discounted. The header is what makes the link worth
 * sharing: it says whose sale it is, how deep, and how long is left.
 *
 * **Phone first.** Everything stacks in one column by default and the discount
 * badge sits above the name; the `680px` rule in `storefront.css` turns it into
 * a row. A shared promo link is opened on a phone, in a chat app, more often
 * than anywhere else.
 *
 * Both date lines are printed only after hydration: they are instants rendered
 * in the SHOPPER's zone, which the server (UTC) cannot know — see
 * `campaignEndsLabel`.
 */
export function CampaignHeader({
  campaign,
  currency,
  t,
}: {
  campaign: StoreCampaignDetail;
  currency?: string;
  t: Dict;
}) {
  const hydrated = useHydrated();
  const amount =
    campaign.type === "percentage"
      ? `${campaign.value}%`
      : money(campaign.value, currency);
  // A live sale counts down to its end; one the merchant shared early counts up
  // to its start. Never both — two dates on one banner is a puzzle, not urgency.
  const when = hydrated
    ? campaign.live
      ? campaignEndsLabel(campaign.endsAt, t)
      : campaignStartsLabel(campaign.startsAt, t)
    : null;

  return (
    <header className="sf-campaign-hero">
      <span className="sf-campaign-badge">
        <span className="sf-campaign-badge-amount">{amount}</span>
        <span className="sf-campaign-badge-off">{t.campaignOff}</span>
      </span>

      <div className="sf-campaign-copy">
        <h1 className="sf-campaign-title">{campaign.name}</h1>
        {campaign.subtitle ? (
          <p className="sf-campaign-subtitle">{campaign.subtitle}</p>
        ) : null}
        {when ? (
          <span className="sf-campaign-when">
            <Icon name="clock" size={14} />
            {when}
          </span>
        ) : null}
        {/* Says why the prices below are the usual ones. Without it a shopper
            arriving on an announced-but-unopened sale reads the banner as a
            promise the page is not keeping. */}
        {!campaign.live ? (
          <p className="sf-campaign-note">{t.campaignUpcoming}</p>
        ) : null}
      </div>
    </header>
  );
}
