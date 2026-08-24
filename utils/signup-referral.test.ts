// coding-standard: maintained
import { describe, it, expect, afterEach } from "vitest";
import { getSignupReferralFromUrl } from "@/utils/signup-referral";

const setUrl = (search: string) => {
  window.history.replaceState({}, "", `/signup${search}`);
};
afterEach(() => setUrl(""));

describe("getSignupReferralFromUrl", () => {
  it("reads ?ref= into referralCode", () => {
    setUrl("?ref=qa-test-partner");
    expect(getSignupReferralFromUrl()).toEqual({ referralCode: "qa-test-partner" });
  });

  it("trims surrounding whitespace", () => {
    setUrl("?ref=%20qa-test-partner%20");
    expect(getSignupReferralFromUrl()).toEqual({ referralCode: "qa-test-partner" });
  });

  // Sending nothing is meaningful: signup must never be blocked by a missing
  // or empty ref — MC just attributes nothing.
  it("sends nothing when the URL carries no ref", () => {
    setUrl("");
    expect(getSignupReferralFromUrl()).toEqual({});
  });

  it("sends nothing when ref is present but empty", () => {
    setUrl("?ref=");
    expect(getSignupReferralFromUrl()).toEqual({});
  });
});
