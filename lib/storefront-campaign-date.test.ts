// coding-standard: maintained

import { describe, expect, it } from "vitest";
import { campaignEndsLabel } from "@/lib/storefront-campaign-date";

/* One end instant, printed on the shopper's clock (CLAUDE.md → Timezones).

   A Dhaka organization ending a campaign on 17 September gets
   `endsAt = 17 Sep 23:59:59.999 in Dhaka` from the backend. The instant never
   changes; only the zone it is printed in does. In the storefront that zone is
   the viewer's own, so the tests pin it explicitly with `timeZone`.

   `now` is injected rather than faked with timers: the only thing it decides is
   whether to add the year.

   Assertions allow the two things that belong to the ICU build rather than to
   this rule: day/month ORDER ("Sep 17" vs "17 Sep") and the space before AM/PM
   (newer ICU uses a narrow no-break space, which `\s` matches). */
const now = new Date("2026-09-08T10:00:00Z");
const endsAt = "2026-09-17T17:59:59.999Z"; // 17 Sep, 11:59 PM in Dhaka
const en = { langCode: "en-BD", campaignEndsAt: "Ends {date} at {time}" };
const bn = { langCode: "bn-BD", campaignEndsAt: "শেষ হবে {date}, {time}" };

describe("campaignEndsLabel — the same end instant on each shopper's clock", () => {
  it("prints the organization's end time for a shopper in Dhaka", () => {
    expect(campaignEndsLabel(endsAt, en, now, "Asia/Dhaka")).toMatch(
      /^Ends (Sep 17|17 Sep) at 11:59\sPM$/,
    );
  });

  it("prints the same instant half an hour earlier in India", () => {
    expect(campaignEndsLabel(endsAt, en, now, "Asia/Kolkata")).toMatch(
      /^Ends (Sep 17|17 Sep) at 11:29\sPM$/,
    );
  });

  it("rolls into the next day for a shopper in Japan", () => {
    expect(campaignEndsLabel(endsAt, en, now, "Asia/Tokyo")).toMatch(
      /^Ends (Sep 18|18 Sep) at 2:59\sAM$/,
    );
  });

  /* The label prints whatever instant the backend resolved — not only the
     end-of-day ones today's date-only form produces. */
  it("prints a mid-day end on each shopper's clock", () => {
    const twoPmDhaka = "2026-09-16T08:00:00.000Z"; // 16 Sep, 2:00 PM in Dhaka
    expect(campaignEndsLabel(twoPmDhaka, en, now, "Asia/Dhaka")).toMatch(
      /^Ends (Sep 16|16 Sep) at 2:00\sPM$/,
    );
    expect(campaignEndsLabel(twoPmDhaka, en, now, "Asia/Kolkata")).toMatch(
      /^Ends (Sep 16|16 Sep) at 1:30\sPM$/,
    );
    expect(campaignEndsLabel(twoPmDhaka, en, now, "Asia/Tokyo")).toMatch(
      /^Ends (Sep 16|16 Sep) at 5:00\sPM$/,
    );
  });

  it("words the phrase naturally in Bangla, with Bengali numerals", () => {
    const label = campaignEndsLabel(endsAt, bn, now, "Asia/Dhaka");
    expect(label).toMatch(/^শেষ হবে /);
    expect(label).toMatch(/১৭/);
    expect(label).toMatch(/সেপ/);
    expect(label).toMatch(/, ১১:৫৯/);
    expect(label).not.toMatch(/[0-9]/);
  });
});

describe("campaignEndsLabel — the year", () => {
  it("omits the year for a campaign ending this year", () => {
    const label = campaignEndsLabel("2026-12-30T12:00:00.000Z", en, now, "Asia/Dhaka");
    expect(label).toMatch(/Dec/);
    expect(label).not.toMatch(/2026/);
  });

  /* The bug this exists for: a long campaign — the two-year kind a merchant
     schedules for a permanent outlet section — read as a date a few weeks away,
     because the strip printed day and month only. */
  it("adds the year once the end date leaves the current year", () => {
    const label = campaignEndsLabel("2028-01-03T12:00:00.000Z", en, now, "Asia/Dhaka");
    expect(label).toMatch(/Jan/);
    expect(label).toMatch(/2028/);
  });

  /* Same rule backwards: a campaign that ended last year is normally filtered
     out server-side, but the Customize preview can still hand one over. */
  it("adds the year for a past year too", () => {
    expect(campaignEndsLabel("2025-11-02T12:00:00.000Z", en, now, "Asia/Dhaka")).toMatch(
      /2025/,
    );
  });

  it("decides the year on the shopper's clock, not UTC's", () => {
    // 31 Dec 23:59 in Dhaka is already 1 Jan 2027 in Tokyo.
    const newYearsEve = "2026-12-31T17:59:59.999Z";
    expect(campaignEndsLabel(newYearsEve, en, now, "Asia/Dhaka")).not.toMatch(/2027/);
    expect(campaignEndsLabel(newYearsEve, en, now, "Asia/Tokyo")).toMatch(/2027/);
  });

  it("localizes the year's numerals in Bangla", () => {
    expect(campaignEndsLabel("2028-01-03T12:00:00.000Z", bn, now, "Asia/Dhaka")).toMatch(
      /২০২৮/,
    );
  });
});

describe("campaignEndsLabel — no label", () => {
  it("returns null for a campaign with no end date or an unparseable one", () => {
    expect(campaignEndsLabel(undefined, en, now)).toBeNull();
    expect(campaignEndsLabel("", en, now)).toBeNull();
    expect(campaignEndsLabel("not-a-date", en, now)).toBeNull();
  });
});
