// coding-standard: maintained
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useContactHours } from "@/components/storefront/use-contact-hours";

vi.mock("@/hooks/use-hydrated", () => ({ useHydrated: () => true }));
vi.mock("@/services/storefront/ui-context", () => ({
  useStorefrontUI: () => ({ t: { chatAway: "Away — back {when}" } }),
}));

const HOURS = { enabled: true, from: "09:00", to: "22:00" };

// A single instant where Dhaka (UTC+6) reads 19:00 — inside the window — and
// Los Angeles (UTC-7 in August) reads 06:00 — outside it. Same absolute time,
// opposite answers: this is the shape of bug QA-115 fixed. Anything reading
// the process/browser clock instead of the passed `timezone` would answer
// the same for both.
const INSTANT = new Date("2026-08-22T13:00:00Z");

describe("useContactHours — shop-timezone hours (QA-115)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(INSTANT);
  });
  afterEach(() => vi.useRealTimers());

  it("is open when it's within the window in the SHOP's timezone", () => {
    const { result } = renderHook(() => useContactHours(HOURS, "Asia/Dhaka"));
    expect(result.current.isAway).toBe(false);
  });

  it("is away when it's outside the window in a DIFFERENT shop timezone — same instant", () => {
    const { result } = renderHook(() => useContactHours(HOURS, "America/Los_Angeles"));
    expect(result.current.isAway).toBe(true);
    expect(result.current.note).toContain("Away");
  });

  it("falls back to the visitor's own clock rather than throwing on a malformed zone", () => {
    expect(() =>
      renderHook(() => useContactHours(HOURS, "Not/A_Real_Zone")),
    ).not.toThrow();
  });

  it("falls back to the visitor's own clock when the payload carries no timezone at all", () => {
    expect(() => renderHook(() => useContactHours(HOURS, undefined))).not.toThrow();
  });

  it("stays open with no away note when hours are disabled", () => {
    const { result } = renderHook(() =>
      useContactHours({ enabled: false }, "America/Los_Angeles"),
    );
    expect(result.current).toEqual({ isAway: false });
  });
});
