// coding-standard: maintained

import { describe, expect, it } from "vitest";
import { campaignEndsLabel } from "@/lib/storefront-campaign-date";

/* `now` is injected rather than faked with timers: the only thing the label
   decides is whether to add the year, so an explicit pair of dates says it
   plainer than a frozen clock.

   Assertions check for the presence of the year, never a full formatted string:
   field ORDER is the ICU locale's business ("3 Jan 2028" vs "Jan 3, 2028") and
   the exact day depends on the runner's timezone. Pinning either would make the
   test a statement about Node's ICU build rather than about this rule. */
const now = new Date("2026-09-08T10:00:00Z");

describe("campaignEndsLabel", () => {
  it("omits the year for a campaign ending this year", () => {
    const label = campaignEndsLabel("2026-12-31T12:00:00.000Z", "en-BD", now);
    expect(label).toMatch(/Dec/);
    expect(label).not.toMatch(/2026/);
  });

  /* The bug this exists for: a long campaign — the two-year kind a merchant
     schedules for a permanent outlet section — read as a date a few weeks away,
     because the strip printed day and month only. */
  it("adds the year once the end date leaves the current year", () => {
    const label = campaignEndsLabel("2028-01-03T12:00:00.000Z", "en-BD", now);
    expect(label).toMatch(/Jan/);
    expect(label).toMatch(/2028/);
  });

  /* Same rule backwards: a campaign that ended last year is normally filtered
     out server-side, but the Customize preview can still hand one over. */
  it("adds the year for a past year too", () => {
    expect(campaignEndsLabel("2025-11-02T12:00:00.000Z", "en-BD", now)).toMatch(
      /2025/,
    );
  });

  it("localizes the numerals, not just the month name", () => {
    // Bengali digits — the reason this is `toLocaleDateString` and not a
    // hand-assembled string.
    expect(campaignEndsLabel("2028-01-03T12:00:00.000Z", "bn-BD", now)).toMatch(
      /২০২৮/,
    );
  });

  it("returns null for a campaign with no end date or an unparseable one", () => {
    expect(campaignEndsLabel(undefined, "en-BD", now)).toBeNull();
    expect(campaignEndsLabel("", "en-BD", now)).toBeNull();
    expect(campaignEndsLabel("not-a-date", "en-BD", now)).toBeNull();
  });
});
