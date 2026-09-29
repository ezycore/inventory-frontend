// coding-standard: maintained
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DealStripView } from "@/components/storefront/home/deal-strip";
import type { StoreCampaign } from "@/lib/storefront-client";

type Dict = Parameters<typeof DealStripView>[0]["t"];

const t = {
  campaignOffers: "Current offers",
  campaignOff: "off",
  campaignEndsAt: "Ends {date} at {time}",
  previousOffer: "Previous offer",
  nextOffer: "Next offer",
  langCode: "en-BD",
} as Dict;

const strip = (campaigns: Partial<StoreCampaign>[]) => (
  <DealStripView base="/shop" campaigns={campaigns as StoreCampaign[]} t={t} heading={t.campaignOffers} />
);

describe("offer position", () => {
  it("is mobile-only because desktop already shows every offer", () => {
    render(
      strip([
        { _id: "one", name: "First offer" },
        { _id: "two", name: "Second offer" },
        { _id: "three", name: "Third offer" },
      ]),
    );

    expect(screen.getByText("1 / 3")).toHaveClass("sf-deals-position");

    const css = readFileSync(resolve(process.cwd(), "app/(storefront)/storefront.css"), "utf8");
    expect(css).toMatch(/\.sf-deals-position\s*{[^}]*display:\s*none;/);
    expect(css).toMatch(
      /@media \(max-width: 640px\)\s*{\s*\.sf-deals-position\s*{\s*display:\s*inline;/,
    );
  });
});

describe("offer card end time", () => {
  const campaigns = [{ _id: "one", name: "Flash sale", endsAt: "2026-12-15T12:00:00.000Z" }];

  it("prints the end instant as one phrase in the browser", () => {
    render(strip(campaigns));
    expect(screen.getByText(/^Ends (Dec 15|15 Dec)(, \d{4})? at \d{1,2}:\d{2}\s(AM|PM)$/)).toBeInTheDocument();
  });

  /* Printed in the shopper's zone, which the UTC server cannot know — so the
     server HTML has the offer but not the label (no hydration mismatch). */
  it("leaves the label out of the server-rendered HTML", () => {
    const html = renderToString(strip(campaigns));
    expect(html).toContain("Flash sale");
    expect(html).not.toContain("Ends");
  });
});
