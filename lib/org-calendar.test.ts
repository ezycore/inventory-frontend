// coding-standard: maintained
/**
 * The organization's calendar on the client (CLAUDE.md → "Timezones"). The suite
 * runs in UTC, so every case sits where Dhaka and UTC disagree about the date.
 */
import { describe, expect, it } from "vitest";

import {
  DEFAULT_TIMEZONE,
  daysUntilDateOnly,
  isDateKeyBeforeOrgToday,
  isExpiryPast,
  orgDateKey,
  orgDayOfInstant,
  pickedDayKey,
  resolveTimezone,
  resolveWeekStartDay,
  storedDateKey,
} from "./org-calendar";

const DHAKA = "Asia/Dhaka";
const at = (iso: string) => new Date(iso);

describe("org calendar", () => {
  it("reads today on the org's calendar, not the runtime's", () => {
    // 02:00 on 17 Sep in Dhaka is still the 16th in UTC.
    expect(orgDateKey(DHAKA, at("2026-09-16T20:00:00Z"))).toBe("2026-09-17");
    expect(resolveTimezone("Bad/Zone")).toBe(DEFAULT_TIMEZONE);
    expect(resolveWeekStartDay(undefined)).toBe(0);
    expect(resolveWeekStartDay(6)).toBe(6);
  });

  /* A campaign/coupon window bound goes back into the edit form as this day. The
     backend reads what comes back on the same calendar, so an untouched field
     round-trips instead of moving the window a day per save. */
  it("names the org-local day a whole-day window bound falls on", () => {
    // Dhaka org, campaign 10–17 Sep.
    expect(orgDayOfInstant("2026-09-09T18:00:00.000Z", DHAKA)).toBe("2026-09-10");
    expect(orgDayOfInstant("2026-09-17T17:59:59.999Z", DHAKA)).toBe("2026-09-17");
    // New York org, same days — the end is already the 18th in UTC.
    expect(orgDayOfInstant("2026-09-18T03:59:59.999Z", "America/New_York")).toBe("2026-09-17");
    expect(orgDayOfInstant(null, DHAKA)).toBe("");
    expect(orgDayOfInstant("not-a-date", DHAKA)).toBe("");
  });

  it("keys a picked calendar day by the day that was clicked", () => {
    // A picker's local midnight — in the UTC test run, and in any zone.
    expect(pickedDayKey(new Date(2026, 8, 17))).toBe("2026-09-17");
  });

  it("reads a stored date-only value as the day it names", () => {
    expect(storedDateKey("2026-09-16T00:00:00.000Z")).toBe("2026-09-16");
  });

  it("keeps a lot good through its whole expiry day, then expires it", () => {
    const expiry = "2026-09-16T00:00:00.000Z";
    expect(isExpiryPast(expiry, DHAKA, at("2026-09-16T00:30:00+06:00"))).toBe(false);
    expect(isExpiryPast(expiry, DHAKA, at("2026-09-16T23:59:00+06:00"))).toBe(false);
    expect(isExpiryPast(expiry, DHAKA, at("2026-09-17T00:00:00+06:00"))).toBe(true);
    expect(isExpiryPast(null, DHAKA, at("2030-01-01T00:00:00Z"))).toBe(false);
    expect(daysUntilDateOnly(expiry, DHAKA, at("2026-09-16T23:59:00+06:00"))).toBe(0);
    expect(daysUntilDateOnly(expiry, DHAKA, at("2026-09-13T10:00:00+06:00"))).toBe(3);
  });

  it("compares a picked day with the org's today", () => {
    const smallHours = at("2026-09-16T20:00:00Z"); // 17 Sep in Dhaka
    expect(isDateKeyBeforeOrgToday("2026-09-16", DHAKA, smallHours)).toBe(true);
    expect(isDateKeyBeforeOrgToday("2026-09-17", DHAKA, smallHours)).toBe(false);
  });
});
