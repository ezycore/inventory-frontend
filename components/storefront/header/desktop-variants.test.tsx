import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * **Every desktop header anatomy must expose the light/dark switch.**
 *
 * The theme is persisted to `localStorage` and re-applied before paint by the
 * storefront layout, so an anatomy that omits the toggle does not merely hide a
 * preference — it strands the shopper in whichever theme they last chose, on
 * every future visit, with no way back. `minimal`, `search-first` and `boutique`
 * all shipped without it, which is how a shop could look permanently dark to its
 * owner while every measurement taken in a fresh browser profile said light.
 *
 * Asserted against the SOURCE rather than a render: these components need the
 * full `HeaderCtx` (cart, session, categories, i18n) to mount, and the thing
 * worth protecting is "the control is wired up in every branch", which reads
 * off the file directly and cannot rot behind a mock.
 */
const SOURCE = readFileSync(
  join(process.cwd(), "components/storefront/header/desktop-variants.tsx"),
  "utf8",
);

/** Every exported `*Desktop` component, discovered rather than hardcoded — a new
 *  anatomy is covered the moment it is written. */
const anatomies = [...SOURCE.matchAll(/export function (\w+Desktop)\b/g)].map((m) => m[1]);

/** The body of one anatomy: from its `export function` to the next one. */
function bodyOf(name: string): string {
  const start = SOURCE.indexOf(`export function ${name}`);
  const rest = SOURCE.slice(start + 1);
  const nextRel = rest.search(/export function \w+Desktop\b/);
  return nextRel === -1 ? rest : rest.slice(0, nextRel);
}

describe("desktop header anatomies", () => {
  it("finds every anatomy in the file", () => {
    expect(anatomies.length).toBeGreaterThanOrEqual(6);
  });

  it.each(anatomies)("%s offers a way out of dark mode", (name) => {
    const body = bodyOf(name);
    // Either the toggle directly, or the utility bar that carries it.
    const hasToggle = /<ThemeBtn\b/.test(body) || /<UtilityBar\b/.test(body);
    expect(hasToggle, `${name} renders no ThemeBtn and no UtilityBar`).toBe(true);
  });
});

/**
 * **Every anatomy that draws its own menu row must reach the merchant's hover
 * setting** — and this is the gap that shipped.
 *
 * The hover control was built against `HeaderNav`, which `classic` and
 * `centered` reach through `CategoryRow`. But `minimal` and `boutique` render
 * their own flat row from `headerLinks(ctx)`, and on those two the new setting
 * did nothing at all — found only by loading a real store, which happened to be
 * on `boutique`. Nothing failed: the header looked right, the control saved, and
 * the effect never appeared.
 *
 * Two conditions, because either alone lets it break again: the class has to be
 * on the link (that is what the rules select), and no `color` may be set inline
 * beside it (an inline declaration outranks every rule in the stylesheet, which
 * is the whole reason the effect was unwritable before this change).
 */
describe("the merchant's menu hover reaches every anatomy that has a menu", () => {
  /** Anatomies rendering their own row rather than delegating to `CategoryRow`. */
  const ownRow = anatomies.filter((name) => bodyOf(name).includes("headerLinks(ctx)"));

  it("finds the anatomies that build their own menu row", () => {
    // If this drops to zero the test below is vacuous — it would pass by
    // asserting nothing, which is exactly how the original gap went unnoticed.
    expect(ownRow.length).toBeGreaterThan(0);
  });

  it.each(ownRow)("%s gives its links the hover class", (name) => {
    expect(bodyOf(name)).toContain('className="sf-nav-top"');
  });

  it.each(ownRow)("%s sets no inline colour on them", (name) => {
    const body = bodyOf(name);
    // Only the `<nav>` row — the cart button and account icons legitimately
    // colour themselves inline and are not menu links.
    const nav = body.slice(body.indexOf("<nav"));
    expect(nav).not.toMatch(/color:\s*"var\(--muted\)"/);
  });
});
