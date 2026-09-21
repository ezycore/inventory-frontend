// coding-standard: maintained
import { describe, expect, it } from "vitest";
import {
  instantOf,
  localParts,
  pageScheduleState,
  scheduleBodyOf,
  scheduleDraftOf,
  scheduleProblem,
  scheduleSummary,
  type PageSchedule,
} from "../page-schedule";

/** Local wall-clock instants, so the tests read the same in any time zone. */
const local = (day: number, hour: number, minute = 0) => new Date(2026, 8, day, hour, minute).toISOString();
const NOW = new Date(2026, 8, 20, 12, 0).getTime();

const schedule = (patch: Partial<PageSchedule>): PageSchedule => ({
  startsAt: null,
  endsAt: null,
  afterEnd: "not-found",
  afterEndPageId: null,
  ...patch,
});

describe("pageScheduleState", () => {
  it("is null with no schedule, and upcoming / live / ended against the clock", () => {
    expect(pageScheduleState(undefined, NOW)).toBeNull();
    expect(pageScheduleState(schedule({}), NOW)).toBeNull();
    expect(pageScheduleState(schedule({ startsAt: local(21, 9) }), NOW)).toBe("upcoming");
    expect(pageScheduleState(schedule({ startsAt: local(19, 9), endsAt: local(21, 9) }), NOW)).toBe("live");
    expect(pageScheduleState(schedule({ endsAt: local(20, 12) }), NOW)).toBe("ended");
  });
});

describe("local fields and instants", () => {
  it("round-trips a stored instant through the date and time fields", () => {
    const stored = local(20, 21, 30);
    expect(localParts(stored)).toEqual({ date: "2026-09-20", time: "21:30" });
    expect(instantOf("2026-09-20", "21:30")).toBe(stored);
  });

  it("reads a date with no time as the start of that day, and no date as nothing", () => {
    expect(instantOf("2026-09-20", "")).toBe(local(20, 0));
    expect(instantOf("", "21:30")).toBeNull();
    expect(localParts(null)).toEqual({ date: "", time: "" });
  });
});

describe("the body the dialog sends", () => {
  it("is null with neither a start nor an end", () => {
    expect(scheduleBodyOf(scheduleDraftOf(undefined))).toBeNull();
  });

  it("sends the default answer when there is no end, and a page only for 'another page'", () => {
    const draft = { ...scheduleDraftOf(undefined), startDate: "2026-09-21", afterEnd: "page" as const, afterEndPageId: "p2" };
    expect(scheduleBodyOf(draft)).toEqual({
      startsAt: local(21, 0),
      endsAt: null,
      afterEnd: "not-found",
      afterEndPageId: null,
    });
    expect(scheduleBodyOf({ ...draft, endDate: "2026-09-25", endTime: "21:00" })).toMatchObject({
      endsAt: local(25, 21),
      afterEnd: "page",
      afterEndPageId: "p2",
    });
  });

  it("names what stops a save", () => {
    const base = { ...scheduleDraftOf(undefined), startDate: "2026-09-21", startTime: "10:00", endDate: "2026-09-21" };
    expect(scheduleProblem({ ...base, endTime: "09:00" })).toBe("The end must be after the start");
    expect(scheduleProblem({ ...base, endTime: "11:00", afterEnd: "page" })).toBe("Choose the page to send shoppers to");
    expect(scheduleProblem({ ...base, endTime: "11:00", afterEnd: "home" })).toBeNull();
  });
});

describe("scheduleSummary", () => {
  it("says what the schedule does next, or did", () => {
    expect(scheduleSummary(schedule({ startsAt: local(21, 21) }), NOW)).toBe("Starts 21 Sep 2026, 9:00 PM");
    expect(scheduleSummary(schedule({ endsAt: local(25, 23, 59) }), NOW)).toBe("Ends 25 Sep 2026, 11:59 PM");
    expect(scheduleSummary(schedule({ endsAt: local(19, 9) }), NOW)).toBe("Ended 19 Sep 2026, 9:00 AM");
    expect(scheduleSummary(schedule({ startsAt: local(19, 9) }), NOW)).toBeNull();
  });
});
