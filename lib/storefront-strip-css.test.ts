// coding-standard: maintained

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The strip presets live in CSS, so nothing in the TypeScript build can catch a
 * preset that was defined at one breakpoint and forgotten at another — the
 * failure is silent and shows up as a phone inheriting a desktop value.
 *
 * This walks the stylesheet instead. It does not evaluate CSS (jsdom applies no
 * media queries); it checks the tables are COMPLETE, which is the mistake a
 * person actually makes when adding a fourth preset or a third strip.
 */
const css = readFileSync(
  join(process.cwd(), "app/(storefront)/storefront.css"),
  "utf8",
);

/** The `@media (min-width: 680px)` block that carries the desktop values. */
const desktopBlock = (() => {
  const start = css.indexOf("[data-sf-strip] { --strip-dismiss-pad: 40px; }");
  expect(start).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("@media (min-width: 1000px)", start));
})();

const baseBlock = css.slice(
  css.indexOf("[data-sf-strip] {"),
  css.indexOf("@media (min-width: 680px)", css.indexOf("[data-sf-strip] {")),
);

describe("strip preset tables are complete at every breakpoint", () => {
  const sizes = ["sm", "md", "lg"] as const;

  it.each(sizes)("campaign size %s is defined on phone and desktop", (size) => {
    const selector = `[data-sf-strip="campaign"][data-strip-size="${size}"]`;
    expect(baseBlock).toContain(selector);
    expect(desktopBlock).toContain(selector);
  });

  it.each(sizes)("campaign vertical space %s is defined on phone and desktop", (v) => {
    const selector = `[data-sf-strip="campaign"][data-strip-pad-y="${v}"]`;
    expect(baseBlock).toContain(selector);
    expect(desktopBlock).toContain(selector);
  });

  it.each(sizes)("campaign side space %s is defined on phone and desktop", (v) => {
    const selector = `[data-sf-strip="campaign"][data-strip-pad-x="${v}"]`;
    expect(baseBlock).toContain(selector);
    expect(desktopBlock).toContain(selector);
  });

  it.each(sizes)("announcement size %s is defined on phone and desktop", (size) => {
    const selector = `[data-sf-strip="announcement"][data-strip-size="${size}"]`;
    expect(baseBlock).toContain(selector);
    expect(desktopBlock).toContain(selector);
  });

  it("gives both strips a side-space value on phone", () => {
    // The announcement bar has no padding-x control, so its value comes from a
    // bare selector; the campaign strip's comes from its three presets.
    expect(baseBlock).toMatch(/\[data-sf-strip="announcement"\] \{ --strip-pad-x:/);
    expect(desktopBlock).toMatch(/\[data-sf-strip="announcement"\] \{ --strip-pad-x:/);
  });

  it("scales the dismiss floor rather than freezing it at the desktop value", () => {
    expect(baseBlock).toMatch(/--strip-dismiss-pad: 34px/);
    expect(desktopBlock).toMatch(/--strip-dismiss-pad: 40px/);
  });
});

describe("phone values are never larger than desktop", () => {
  /* The whole point of the change, asserted structurally so that adding a
     preset cannot skip the check.

     Matched by SELECTOR rather than by position: the two blocks happen to list
     their rules in the same order today, and a positional comparison would pass
     for the wrong reason the moment someone reorders one of them. */
  const declarations = (block: string): Map<string, number> => {
    const found = new Map<string, number>();
    for (const [, selector, body] of block.matchAll(
      /(\[data-sf-strip[^{]*?)\s*\{([^}]*)\}/g,
    )) {
      for (const [, prop, value] of body.matchAll(/--(strip-[\w-]+):\s*([\d.]+)px/g)) {
        found.set(`${selector.trim()} --${prop}`, Number(value));
      }
    }
    return found;
  };

  const phone = declarations(baseBlock);
  const desktop = declarations(desktopBlock);

  it("declares the same set of tokens at both breakpoints", () => {
    expect(phone.size).toBeGreaterThan(10);
    expect([...desktop.keys()].sort()).toEqual([...phone.keys()].sort());
  });

  it.each([...phone.entries()])("%s is not larger on a phone", (key, value) => {
    expect(value).toBeLessThanOrEqual(desktop.get(key)!);
  });

  it("actually shrinks the tokens whose cost is a share of the screen", () => {
    // A table copied unchanged into the phone tier would pass every assertion
    // above while fixing nothing, so at least the side space and the dismiss
    // floor must genuinely be smaller.
    expect(phone.get('[data-sf-strip="campaign"][data-strip-pad-x="lg"] --strip-pad-x'))
      .toBeLessThan(
        desktop.get('[data-sf-strip="campaign"][data-strip-pad-x="lg"] --strip-pad-x')!,
      );
    expect(phone.get("[data-sf-strip] --strip-dismiss-pad")).toBeLessThan(
      desktop.get("[data-sf-strip] --strip-dismiss-pad")!,
    );
  });
});
