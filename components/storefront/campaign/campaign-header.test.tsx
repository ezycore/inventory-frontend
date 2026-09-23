// coding-standard: maintained
/**
 * The campaign landing page's banner.
 *
 * Two things are pinned, and both are about not lying to a shopper who followed
 * a shared link:
 *
 *  1. **`live` comes from the server, and the banner obeys it.** A merchant can
 *     copy a campaign's link the moment they schedule it, so the page has to
 *     answer before the sale opens — with the everyday prices the pricer is
 *     actually charging, and a line saying so. Reading the dates here instead
 *     would let a shopper's wrong device clock promise a discount the backend is
 *     not applying.
 *  2. **Exactly one date line.** A live sale counts down to its end, a scheduled
 *     one counts up to its start; both at once is a puzzle, not urgency.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CampaignHeader } from "@/components/storefront/campaign/campaign-header";
import type { StoreCampaignDetail } from "@/lib/storefront-client";
import { I18N } from "@/lib/storefront-i18n";

const DAY = 86_400_000;

const campaign = (extra: Partial<StoreCampaignDetail> = {}): StoreCampaignDetail => ({
  _id: "c1",
  slug: "eid-sale",
  name: "Eid Sale",
  type: "percentage",
  value: 25,
  scope: "product",
  startsAt: new Date(Date.now() - DAY).toISOString(),
  endsAt: new Date(Date.now() + DAY).toISOString(),
  live: true,
  ...extra,
});

const renderHeader = (extra: Partial<StoreCampaignDetail> = {}) =>
  render(
    <CampaignHeader campaign={campaign(extra)} currency="BDT" t={I18N.en} />,
  );

describe("CampaignHeader", () => {
  it("names the sale and how deep it cuts", () => {
    renderHeader();
    expect(screen.getByRole("heading", { name: "Eid Sale" })).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("prints a fixed discount as money, not a bare number", () => {
    renderHeader({ type: "fixed", value: 200 });
    // "200" alone reads as a percentage on a banner whose neighbour says "25%".
    expect(screen.queryByText("200")).not.toBeInTheDocument();
  });

  it("shows the merchant's tagline when there is one, and no empty line when there is not", () => {
    const { unmount } = renderHeader({ subtitle: "Three days only" });
    expect(screen.getByText("Three days only")).toBeInTheDocument();
    unmount();

    renderHeader({ subtitle: null });
    expect(document.querySelector(".sf-campaign-subtitle")).toBeNull();
  });

  it("counts DOWN on a live sale and says nothing about a start", () => {
    renderHeader();
    expect(screen.getByText(/^Ends /)).toBeInTheDocument();
    expect(screen.queryByText(/^Starts /)).not.toBeInTheDocument();
    expect(screen.queryByText(I18N.en.campaignUpcoming)).not.toBeInTheDocument();
  });

  it("counts UP on a scheduled sale, and explains the full prices below it", () => {
    // The shape a merchant shares the day before. Without the note, the banner
    // reads as a promise the grid underneath is not keeping.
    renderHeader({
      live: false,
      startsAt: new Date(Date.now() + DAY).toISOString(),
      endsAt: new Date(Date.now() + 4 * DAY).toISOString(),
    });
    expect(screen.getByText(/^Starts /)).toBeInTheDocument();
    expect(screen.queryByText(/^Ends /)).not.toBeInTheDocument();
    expect(screen.getByText(I18N.en.campaignUpcoming)).toBeInTheDocument();
  });

  it("trusts `live`, not the dates", () => {
    // A stale `endsAt` with `live: true` still renders as a running sale: the
    // server decides, because the server is also what prices the grid.
    renderHeader({ live: true, endsAt: new Date(Date.now() - DAY).toISOString() });
    expect(screen.queryByText(I18N.en.campaignUpcoming)).not.toBeInTheDocument();
  });
});
