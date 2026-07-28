import { describe, it, expect } from "vitest";
import { affixPadding, resolveAffix } from "@/ui/components/form/field-affix";

/**
 * The affix shell draws prefix/suffix text absolutely over the input, so the
 * input's own padding is the only thing keeping the value clear of it. A fixed
 * right pad worked while every suffix was one character ("%"), and broke the
 * moment a long one arrived — the signup page's workspace domain
 * (".ezycore.com") sat on top of the typed slug.
 */
describe("affixPadding", () => {
  it("adds no padding when there is no affix", () => {
    expect(affixPadding(undefined, undefined)).toBe("");
  });

  it("pads left for a prefix", () => {
    expect(affixPadding("+", undefined)).toBe("pl-8");
  });

  it("keeps pr-14 for the short suffixes that already existed", () => {
    expect(affixPadding(undefined, "%")).toBe("pr-14");
    expect(affixPadding(undefined, "kg")).toBe("pr-14");
    expect(affixPadding(undefined, "months")).toBe("pr-14");
  });

  it("widens as the suffix grows so it cannot overlap the value", () => {
    expect(affixPadding(undefined, "per unit")).toBe("pr-20");
    expect(affixPadding(undefined, ".ezycore.com")).toBe("pr-28");
  });

  it("combines both sides", () => {
    expect(affixPadding("$", ".ezycore.com")).toBe("pl-8 pr-28");
  });

  // Tailwind scans source for literal class names — a computed one is never
  // emitted, so the branches must stay spelled out.
  it("only ever emits literal class names", () => {
    const all = [
      affixPadding("+", undefined),
      affixPadding(undefined, "%"),
      affixPadding(undefined, "per unit"),
      affixPadding(undefined, ".ezycore.com"),
    ].join(" ");
    expect(all).not.toMatch(/\[|\$\{/);
  });
});

describe("resolveAffix", () => {
  it("passes a plain string through", () => {
    expect(resolveAffix(".ezycore.com", {})).toBe(".ezycore.com");
  });

  it("calls the function form with the current values", () => {
    const suffix = (v: Record<string, any>) => `.${v.root}`;
    expect(resolveAffix(suffix, { root: "ezycore.com" })).toBe(".ezycore.com");
  });

  // How the signup field hides the domain when NEXT_PUBLIC_ROOT_DOMAIN is unset
  // (local dev / single-host), where there is no subdomain to advertise.
  it("supports a function that opts out by returning undefined", () => {
    expect(resolveAffix(() => undefined, {})).toBeUndefined();
    expect(affixPadding(undefined, resolveAffix(() => undefined, {}))).toBe("");
  });
});
