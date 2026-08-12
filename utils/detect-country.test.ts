import { afterEach, describe, expect, it, vi } from "vitest";

import { COUNTRY_DATA } from "@/constants/organization-options";
import { detectCountryCode } from "@/utils/detect-country";

/**
 * The signup form pre-selects whatever this returns, so a wrong answer is worse
 * than none: it silently sets the workspace's timezone and currency too.
 */

/** Pin the device timezone `Intl.DateTimeFormat().resolvedOptions()` reports. */
function stubTimeZone(timeZone: string | undefined) {
  vi.spyOn(Intl, "DateTimeFormat").mockReturnValue({
    resolvedOptions: () => ({ timeZone }) as Intl.ResolvedDateTimeFormatOptions,
  } as Intl.DateTimeFormat);
}

function stubLanguages(languages: string[]) {
  vi.spyOn(navigator, "languages", "get").mockReturnValue(languages);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("detectCountryCode", () => {
  it("resolves the target market from its timezone", () => {
    stubTimeZone("Asia/Dhaka");
    expect(detectCountryCode()).toBe("BD");
  });

  it("resolves a country from any of its zones, not just the one on COUNTRY_DATA", () => {
    // COUNTRY_DATA stores America/New_York for the US; a US signup is far more
    // likely to report one of the other four.
    for (const zone of [
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Pacific/Honolulu",
    ]) {
      stubTimeZone(zone);
      expect(detectCountryCode()).toBe("US");
      vi.restoreAllMocks();
    }
  });

  it("accepts the legacy Asia/Calcutta spelling older ICU builds still report", () => {
    stubTimeZone("Asia/Calcutta");
    expect(detectCountryCode()).toBe("IN");
  });

  it("falls back to the language region when the zone is unknown", () => {
    stubTimeZone("Africa/Lagos");
    stubLanguages(["bn-BD", "en"]);
    expect(detectCountryCode()).toBe("BD");
  });

  it("maps the ISO region GB onto the list's non-ISO 'UK' value", () => {
    stubTimeZone("Africa/Lagos");
    stubLanguages(["en-GB"]);
    expect(detectCountryCode()).toBe("UK");
  });

  it("returns null rather than guessing at an unsupported country", () => {
    stubTimeZone("Africa/Lagos");
    stubLanguages(["en-NG"]);
    expect(detectCountryCode()).toBeNull();
  });

  it("returns null when neither signal says anything", () => {
    stubTimeZone(undefined);
    stubLanguages(["en"]);
    expect(detectCountryCode()).toBeNull();
  });

  it("only ever returns a code the country dropdown actually offers", () => {
    const offered = new Set(COUNTRY_DATA.map((c) => c.value));
    for (const zone of ["Asia/Dhaka", "Asia/Karachi", "Europe/London"]) {
      stubTimeZone(zone);
      expect(offered.has(detectCountryCode() as string)).toBe(true);
      vi.restoreAllMocks();
    }
  });
});
