// coding-standard: maintained
import { describe, it, expect, afterEach } from "vitest";
import { getSignupPlanFromUrl, prettyPlanName } from "@/utils/signup-plan";

const setUrl = (search: string) => {
  window.history.replaceState({}, "", `/signup${search}`);
};
afterEach(() => setUrl(""));

describe("prettyPlanName", () => {
  it("drops the cadence suffix and title-cases the package", () => {
    expect(prettyPlanName("growth-monthly")).toBe("Growth");
    expect(prettyPlanName("scale-yearly")).toBe("Scale");
    expect(prettyPlanName("pro-plus-annual")).toBe("Pro Plus");
  });

  it("keeps a slug that carries no cadence", () => {
    expect(prettyPlanName("starter")).toBe("Starter");
  });

  // "monthly" alone is the whole package name, not a suffix to strip — dropping
  // it would leave an empty badge.
  it("never strips the only word", () => {
    expect(prettyPlanName("monthly")).toBe("Monthly");
  });
});

describe("getSignupPlanFromUrl", () => {
  // The regression that mattered: marketing sends `?plan=<slug>`, and mapping
  // it to planName alone left planSlug undefined — so Mission Control fell back
  // to the entry plan and "Start with Growth" provisioned the wrong package.
  it("treats ?plan= as the SLUG and derives a display name from it", () => {
    setUrl("?plan=growth-monthly");
    expect(getSignupPlanFromUrl()).toEqual({
      planSlug: "growth-monthly",
      planName: "Growth",
    });
  });

  it("prefers an explicit planName over the derived one", () => {
    setUrl("?plan=growth-monthly&planName=Growth%20Plan");
    expect(getSignupPlanFromUrl()).toEqual({
      planSlug: "growth-monthly",
      planName: "Growth Plan",
    });
  });

  it("prefers an explicit planSlug over ?plan=", () => {
    setUrl("?plan=growth-monthly&planSlug=scale-yearly");
    expect(getSignupPlanFromUrl()).toEqual({
      planSlug: "scale-yearly",
      planName: "Scale",
    });
  });

  // Sending nothing is meaningful: MC picks the entry plan. A hardcoded default
  // here would break every direct signup the day that plan is renamed.
  it("sends nothing when no plan was chosen", () => {
    setUrl("");
    expect(getSignupPlanFromUrl()).toEqual({});
  });
});
