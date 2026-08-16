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
