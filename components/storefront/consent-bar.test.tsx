// coding-standard: maintained

import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorefrontUIProvider } from "@/services/storefront/ui-context";
import { ConsentBar } from "@/components/storefront/consent-bar";

/**
 * The consent bar's rules, all of which are anti-annoyance rules and none of which is visible in
 * a type-check.
 *
 * The one that costs money if it breaks is the checkout exclusion: a bar between a shopper and a
 * payment is a lost sale on somebody's real shop.
 */

let pathname = "/shop";
vi.mock("@/services/storefront/use-store-pathname", () => ({
  useStorePathname: () => pathname,
}));

const clarity = vi.fn();

const renderBar = (mode: "off" | "eu" | "always") =>
  render(
    <StorefrontUIProvider>
      <ConsentBar mode={mode} />
    </StorefrontUIProvider>,
  );

/** The bar is deliberately late — nothing is on screen until a scroll or 3s. */
const waitForBar = () => act(() => void vi.advanceTimersByTime(3000));

/**
 * Pretend the shopper's device is in `timeZone`.
 *
 * The whole `Intl.DateTimeFormat` constructor is stubbed rather than its prototype method:
 * `onEuropeanClock` calls it WITHOUT `new`, and V8 answers that with a wrapper object whose
 * `resolvedOptions` does not resolve through a prototype spy.
 */
const pretendTimeZone = (timeZone: string) => {
  const real = Intl.DateTimeFormat;
  const fake = Object.assign(
    function DateTimeFormat() {
      return { resolvedOptions: () => ({ timeZone }) };
    },
    { supportedLocalesOf: real.supportedLocalesOf },
  ) as unknown as typeof Intl.DateTimeFormat;
  vi.stubGlobal("Intl", { ...Intl, DateTimeFormat: fake });
};

describe("ConsentBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    pathname = "/shop";
    clarity.mockClear();
    window.clarity = clarity;
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete window.clarity;
  });

  it("never renders on checkout", () => {
    pathname = "/shop/checkout";
    renderBar("always");
    waitForBar();
    expect(screen.queryByRole("region")).toBeNull();
    // …and no consent is assumed either way: silence leaves Clarity in its cookieless mode.
    expect(clarity).not.toHaveBeenCalled();
  });

  it("never renders when the merchant asked for no banner", () => {
    renderBar("off");
    waitForBar();
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("does not paint during first paint", () => {
    renderBar("always");
    // Before the timer and before any scroll: the hero must not share the screen with this.
    expect(screen.queryByRole("region")).toBeNull();
    waitForBar();
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("remembers a refusal and never asks again", () => {
    renderBar("always");
    waitForBar();
    act(() => screen.getByText("No thanks").click());

    expect(screen.queryByRole("region")).toBeNull();
    expect(clarity).toHaveBeenCalledWith("consentv2", {
      ad_Storage: "denied",
      analytics_Storage: "denied",
    });

    // A second visit: the answer is replayed to the tag, and nothing is shown.
    clarity.mockClear();
    renderBar("always");
    waitForBar();
    expect(screen.queryByRole("region")).toBeNull();
    expect(clarity).toHaveBeenCalledWith("consentv2", {
      ad_Storage: "denied",
      analytics_Storage: "denied",
    });
  });

  it("replays an acceptance on the next page load", () => {
    renderBar("always");
    waitForBar();
    act(() => screen.getByText("Allow").click());

    clarity.mockClear();
    renderBar("always");
    // Clarity's consent state lives in the tag, not in our storage — a shopper who accepted
    // last week is only recognised if the page says so again now.
    expect(clarity).toHaveBeenCalledWith("consentv2", {
      ad_Storage: "denied",
      analytics_Storage: "granted",
    });
  });

  it("shows nothing to a Bangladeshi shopper in `eu` mode", () => {
    pretendTimeZone("Asia/Dhaka");

    renderBar("eu");
    waitForBar();
    expect(screen.queryByRole("region")).toBeNull();
  });

  it("shows it to a European shopper in `eu` mode", () => {
    pretendTimeZone("Europe/Berlin");

    renderBar("eu");
    waitForBar();
    expect(screen.getByRole("region")).toBeInTheDocument();
  });
});
