import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useHideOnScroll } from "@/components/storefront/filters/use-hide-on-scroll";

const scrollTo = (y: number) =>
  act(() => {
    Object.defineProperty(window, "scrollY", { value: y, configurable: true });
    window.dispatchEvent(new Event("scroll"));
    vi.runAllTimers();
  });

describe("useHideOnScroll", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "setTimeout"] });
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
  });
  afterEach(() => vi.useRealTimers());

  it("hides while reading down past the offset and returns on the way up", () => {
    const { result } = renderHook(() => useHideOnScroll(true, 160));
    scrollTo(100);
    expect(result.current).toBe(false);
    scrollTo(600);
    expect(result.current).toBe(true);
    scrollTo(595); // jitter under the slack changes nothing
    expect(result.current).toBe(true);
    scrollTo(500);
    expect(result.current).toBe(false);
  });

  it("always answers false when switched off", () => {
    const { result } = renderHook(() => useHideOnScroll(false));
    scrollTo(900);
    expect(result.current).toBe(false);
  });
});
