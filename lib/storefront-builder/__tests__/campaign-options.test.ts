// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { campaignPickerOptions, type CampaignPickerDoc } from "../campaign-options";

// 25 Sep 2026, 09:07 in Dhaka — the moment "Eid Sale" was reported missing.
const now = Date.parse("2026-09-25T03:07:51Z");
const tz = "Asia/Dhaka";

const mega: CampaignPickerDoc = {
  _id: "mega",
  name: "Mega Sale",
  startsAt: "2026-08-31T18:00:00.000Z",
  endsAt: "2026-12-31T17:59:59.999Z",
  status: "active",
};
// Status `active`, window closed: the live case.
const eid: CampaignPickerDoc = {
  _id: "eid",
  name: "Eid Sale",
  startsAt: "2026-09-21T18:00:00.000Z",
  endsAt: "2026-09-22T17:59:59.999Z",
  status: "active",
};
const puja: CampaignPickerDoc = {
  _id: "puja",
  name: "Puja Sale",
  startsAt: "2026-09-30T18:00:00.000Z",
  endsAt: "2026-10-10T17:59:59.999Z",
  status: "active",
};
const paused: CampaignPickerDoc = { ...mega, _id: "paused", name: "Flash", status: "inactive" };

describe("campaignPickerOptions", () => {
  it("offers running then upcoming offers, and leaves ended and switched-off ones out", () => {
    expect(campaignPickerOptions([eid, puja, paused, mega], { now, timezone: tz })).toEqual([
      { value: "mega", label: "Mega Sale · until 31 Dec" },
      { value: "puja", label: "Puja Sale · starts 1 Oct" },
    ]);
  });

  it("keeps the picked offer once it has ended, saying so, and not pickable again", () => {
    expect(campaignPickerOptions([eid, mega], { now, timezone: tz, pickedId: "eid" })).toEqual([
      { value: "mega", label: "Mega Sale · until 31 Dec" },
      { value: "eid", label: "Eid Sale · ended 22 Sep", disabled: true },
    ]);
    expect(campaignPickerOptions([paused], { now, timezone: tz, pickedId: "paused" })).toEqual([
      { value: "paused", label: "Flash · turned off", disabled: true },
    ]);
  });

  it("prints dates on the organization's calendar, not UTC's", () => {
    // Eid's last instant is 17:59 UTC on the 22nd — 23:59 in Dhaka, still the
    // 22nd; its first is 18:00 UTC on the 21st, already the 22nd in Dhaka.
    const [option] = campaignPickerOptions([eid], {
      now: Date.parse("2026-09-21T20:00:00Z"),
      timezone: tz,
    });
    expect(option.label).toBe("Eid Sale · until 22 Sep");
    const [upcoming] = campaignPickerOptions([eid], { now: Date.parse("2026-09-20T00:00:00Z"), timezone: tz });
    expect(upcoming.label).toBe("Eid Sale · starts 22 Sep");
  });
});
