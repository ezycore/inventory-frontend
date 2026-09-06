// coding-standard: maintained

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  DEFAULT_DESIGN,
  DESIGN_FONTS,
  DESIGN_SURFACES,
  isDarkSurface,
  surfaceSwatch,
} from "@/lib/storefront-theme";

/**
 * A surface is declared in TWO files that cannot see each other: the twelve
 * colour tokens live in `storefront.css`, and the three-colour swatch the
 * merchant actually picks from is a hand-copied literal in
 * `lib/storefront-theme.ts` — because the admin is not inside `.sf-root` and so
 * cannot read a storefront token.
 *
 * Nothing in the TypeScript build can see either half of that. A surface added
 * to the catalogue with no CSS renders as the default look under a different
 * name; a swatch copied wrong shows the merchant a shop that does not exist;
 * a missing dark block drops the shopper onto the built-in zinc mid-session;
 * a missing `body` rule shows the admin's near-black on an overscroll bounce.
 * Every one of those is silent.
 *
 * So this walks the stylesheet. It evaluates no CSS — jsdom applies no
 * `:has()` and no media queries — it checks the tables are COMPLETE and that
 * the two copies of each colour agree, which is the mistake a person actually
 * makes when adding the ninth surface.
 */
const css = readFileSync(
  join(process.cwd(), "app/(storefront)/storefront.css"),
  "utf8",
);

const fontsModule = readFileSync(
  join(process.cwd(), "app/(storefront)/fonts.ts"),
  "utf8",
);

/** The declarations inside the first rule whose selector matches, or null. */
function ruleBody(selector: string): string | null {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) return null;
  const open = css.indexOf("{", start);
  const close = css.indexOf("}", open);
  return css.slice(open + 1, close);
}

/** One custom property's value out of a rule body. */
function token(body: string | null, name: string): string | null {
  if (!body) return null;
  const match = new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(body);
  return match ? match[1].trim() : null;
}

const lightSelector = (id: string) =>
  id === DEFAULT_DESIGN.surface
    ? ".sf-root"
    : `.sf-root:has(.sf-shell[data-surface="${id}"])`;

const darkSelector = (id: string) =>
  id === DEFAULT_DESIGN.surface
    ? '.sf-root[data-theme="dark"]'
    : `.sf-root[data-theme="dark"]:has(.sf-shell[data-surface="${id}"])`;

const bodySelector = (id: string, dark: boolean) => {
  const shell = `.sf-shell[data-surface="${id}"]`;
  const inner = dark ? `.sf-root[data-theme="dark"] ${shell}` : shell;
  return `body:has(${inner})`;
};

/**
 * The twelve a surface owns. `--primary` and friends are deliberately absent —
 * a surface is the paper, the brand is the merchant's mark on it, and a surface
 * that set one would repaint a shop's own colour when the ground changed.
 */
const SURFACE_TOKENS = [
  "--page",
  "--card",
  "--surface",
  "--surface-2",
  "--text",
  "--muted",
  "--faint",
  "--border",
  "--border-strong",
  "--header",
  "--discount",
  "--discount-soft",
];

const ids = DESIGN_SURFACES.map((s) => s.id);
const custom = ids.filter((id) => id !== DEFAULT_DESIGN.surface);

describe("every surface is fully declared", () => {
  it.each(ids)("%s defines all twelve tokens on light", (id) => {
    const body = ruleBody(lightSelector(id));
    expect(body).not.toBeNull();
    for (const name of SURFACE_TOKENS) expect(token(body, name)).not.toBeNull();
  });

  it.each(ids)("%s defines all twelve tokens on dark", (id) => {
    const body = ruleBody(darkSelector(id));
    expect(body).not.toBeNull();
    for (const name of SURFACE_TOKENS) expect(token(body, name)).not.toBeNull();
  });

  // `body` sits outside `.sf-root` and cannot read its custom properties, so
  // these are literals by necessity — and the overscroll canvas is the one place
  // a shopper sees the admin's ground instead of the shop's.
  it.each(custom)("%s paints the overscroll canvas in both themes", (id) => {
    expect(css).toContain(bodySelector(id, false));
    expect(css).toContain(bodySelector(id, true));
  });

  it.each(custom)("%s's body rules repeat its own --page", (id) => {
    for (const dark of [false, true]) {
      expect(token(ruleBody(bodySelector(id, dark)), "background")).toBe(
        token(ruleBody(dark ? darkSelector(id) : lightSelector(id)), "--page"),
      );
    }
  });
});

describe("the admin swatch shows the shop that exists", () => {
  // `surfaceSwatch` falls back to `default` for an unknown id, so an id with no
  // row does not throw — it silently previews the wrong shop.
  it.each(ids)("%s has its own swatch row", (id) => {
    const own = surfaceSwatch(id);
    if (id === DEFAULT_DESIGN.surface) return;
    expect(own).not.toBe(surfaceSwatch("no-such-surface"));
  });

  it.each(ids)("%s's swatch is [page, card, panel] from the CSS", (id) => {
    const body = ruleBody(lightSelector(id));
    expect(surfaceSwatch(id)).toEqual([
      token(body, "--page"),
      token(body, "--card"),
      token(body, "--surface"),
    ]);
  });
});

describe("a dark ground carries its four extra rules", () => {
  const darkGrounds = ids.filter(isDarkSurface);

  // Not a formality: the catalogue is a light-ground catalogue by default, and
  // the whole `[data-ground]` mechanism is dead weight if nothing selects it.
  it("has at least one", () => {
    expect(darkGrounds.length).toBeGreaterThan(0);
  });

  it.each([
    ['.sf-root:has(.sf-shell[data-ground="dark"])', "color-scheme"],
    ['.sf-root:has(.sf-shell[data-ground="dark"]) .sf-shell[data-brand]', "--primary"],
    ['.sf-root:has(.sf-shell[data-ground="dark"]) .sf-shell[data-accent]', "--accent"],
    ['.sf-root:has(.sf-shell[data-ground="dark"]) .sf-skeleton', "background-image"],
  ])("%s sets %s", (selector, property) => {
    expect(token(ruleBody(selector), property)).not.toBeNull();
  });

  // The brand swap is the one that must WIN — the plain `.sf-shell[data-brand]`
  // rule sits above it and would otherwise hand a near-black page the merchant's
  // unlifted navy.
  it("swaps to the lifted brand, not the light one", () => {
    const body = ruleBody(
      '.sf-root:has(.sf-shell[data-ground="dark"]) .sf-shell[data-brand]',
    );
    expect(token(body, "--primary")).toBe("var(--sf-brand-dark)");
  });
});

describe("every typeface option resolves to a real family", () => {
  const declared = new Set(
    [...fontsModule.matchAll(/variable:\s*"(--font-[a-z0-9-]+)"/g)].map(
      (m) => m[1],
    ),
  );

  it.each(DESIGN_FONTS.map((f) => f.id))("%s has a stack", (id) => {
    // The default is the `.sf-root` base stack and correctly has no block.
    if (id === DEFAULT_DESIGN.font) return;
    expect(token(ruleBody(`.sf-shell[data-font="${id}"]`), "--font-storefront"))
      .not.toBeNull();
  });

  // The failure this catches is a misspelled variable — `--font-playfair` where
  // fonts.ts declared `--font-playfair-display`. Nothing errors; the face simply
  // never loads and the shop renders in the fallback serif.
  it("references no --font-* variable that fonts.ts does not declare", () => {
    const referenced = new Set(
      [...css.matchAll(/var\((--font-[a-z0-9-]+)\)/g)].map((m) => m[1]),
    );
    // `--font-storefront` and `--font-display` are the storefront's own
    // indirection, defined in the CSS itself rather than loaded by next/font.
    referenced.delete("--font-storefront");
    referenced.delete("--font-display");
    expect([...referenced].filter((v) => !declared.has(v))).toEqual([]);
  });

  // A family loaded but wired to nothing is dead weight in the bundle.
  it("loads no family the stylesheet never uses", () => {
    const referenced = css.match(/var\((--font-[a-z0-9-]+)\)/g) ?? [];
    const used = new Set(referenced.map((v) => v.slice(4, -1)));
    expect([...declared].filter((v) => !used.has(v))).toEqual([]);
  });
});
