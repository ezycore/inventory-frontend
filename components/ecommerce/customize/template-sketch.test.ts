import { describe, expect, it } from "vitest";
import { SKETCH_KEYS } from "@/components/ecommerce/customize/template-sketch";
import { TEMPLATE_OPTIONS } from "@/components/ecommerce/customize/template-options";

/**
 * Every layout option a merchant can pick should show a wireframe of what it
 * does. The lookup falls back to an empty `<Frame />`, so a missing entry is not
 * a missing decoration — it renders a blank box, and a panel where every option
 * is a blank box is a control a merchant cannot use at all.
 *
 * Found the hard way: `productCard:editorial` shipped with no sketch and drew an
 * empty tile beside three drawn ones, and four whole panels — Shell, Cart
 * layout, Content layout and Account area — had no sketches at all.
 */

/**
 * Options still waiting for a wireframe. **This list may only ever shrink.**
 *
 * It exists so the guard can be added now, with the gap recorded honestly,
 * rather than waiting until all of them are drawn — a test that cannot be turned
 * on until a backlog is cleared is a test that never gets added. Delete an entry
 * as you draw it; the second assertion below fails if a stale one lingers.
 */
const NOT_YET_DRAWN = [
  "header:clinical",
  "checkout:guided",
  "checkout:editorial",
  "categoryTiles:disc",
  "shell:stacked",
  "shell:rail",
  "cartLayout:panel",
  "cartLayout:compact",
  "cartLayout:cards",
  "cartLayout:editorial",
  "contentLayout:centered",
  "contentLayout:banner",
  "contentLayout:panel",
  "contentLayout:editorial",
  "accountLayout:sidebar",
  "accountLayout:tabs",
  "accountLayout:panel",
  "accountLayout:editorial",
];

const everyOption = Object.entries(TEMPLATE_OPTIONS).flatMap(([key, options]) =>
  options.map((o) => `${key}:${o.value}`),
);

describe("template sketch coverage", () => {
  it("draws every option the merchant can pick", () => {
    const drawn = new Set(SKETCH_KEYS);
    const missing = everyOption.filter(
      (id) => !drawn.has(id) && !NOT_YET_DRAWN.includes(id),
    );
    expect(missing).toEqual([]);
  });

  // Keeps the debt list honest: an entry that has since been drawn, or one for
  // an option that no longer exists, must be deleted rather than left to imply
  // a gap that is not there.
  it("has no stale entries in the backlog", () => {
    const drawn = new Set(SKETCH_KEYS);
    const stale = NOT_YET_DRAWN.filter(
      (id) => drawn.has(id) || !everyOption.includes(id),
    );
    expect(stale).toEqual([]);
  });

  it("never sketches an option that does not exist", () => {
    const options = new Set(everyOption);
    // `imageRatio`/`imageFit` and the design axes live outside TEMPLATE_OPTIONS,
    // so only keys the picker actually reads are checked here.
    const orphans = SKETCH_KEYS.filter(
      (id) => !options.has(id) && TEMPLATE_OPTIONS[id.split(":")[0]],
    );
    expect(orphans).toEqual([]);
  });
});
