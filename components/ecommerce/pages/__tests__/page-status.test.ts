// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { pageStatus } from "../page-status";

const NOW = Date.parse("2026-09-24T06:00:00Z");
const schedule = (startsAt: string | null, endsAt: string | null) => ({
  startsAt,
  endsAt,
  afterEnd: "not-found" as const,
  afterEndPageId: null,
});

describe("pageStatus", () => {
  it("a draft is Draft whatever its schedule", () => {
    const status = pageStatus({ status: "draft", schedule: schedule("2026-10-01T00:00:00Z", null) }, NOW);
    expect(status).toEqual({ variant: "draft", label: "Draft", note: null });
  });

  it("a switched-off page is Off", () => {
    expect(pageStatus({ status: "disabled" }, NOW).label).toBe("Off");
  });

  it("a published page with no schedule is Live", () => {
    expect(pageStatus({ status: "published" }, NOW)).toEqual({ variant: "published", label: "Live", note: null });
  });

  it("a published page that has not started is Scheduled, with when it starts", () => {
    const status = pageStatus({ status: "published", schedule: schedule("2026-09-28T04:00:00Z", null) }, NOW);
    expect(status.variant).toBe("scheduled");
    expect(status.label).toBe("Scheduled");
    expect(status.note).toMatch(/^Starts /);
  });

  it("a published page past its end is Ended, grey rather than red", () => {
    const status = pageStatus({ status: "published", schedule: schedule(null, "2026-08-31T18:00:00Z") }, NOW);
    expect(status).toMatchObject({ variant: "inactive", label: "Ended" });
    expect(status.note).toMatch(/^Ended /);
  });

  it("a running page with an end is Live, with when it ends", () => {
    const status = pageStatus({ status: "published", schedule: schedule(null, "2026-10-12T18:00:00Z") }, NOW);
    expect(status).toMatchObject({ variant: "published", label: "Live" });
    expect(status.note).toMatch(/^Ends /);
  });
});
