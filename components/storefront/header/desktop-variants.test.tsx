import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * **Every desktop anatomy must carry its own light/dark switch.**
 *
 * The theme is persisted to `localStorage` and re-applied before paint by the
 * storefront layout, so an anatomy that omits the toggle does not merely hide a
 * preference — it strands the shopper in whichever theme they last chose, on
 * every future visit, with no way back. `minimal`, `search-first` and `boutique`
 * all shipped without it, which is how a shop could look permanently dark to its
 * owner while every measurement taken in a fresh browser profile said light.
 *
 * Classic is IN this list, and that is the point. It briefly drew its switch
 * only from the utility bar above it — a bar the merchant can now switch off,
 * which put the DEFAULT template one toggle away from exactly the dead end
 * above. Its own switch is the floor; `ctx.needsTheme` only hides it while the
 * bar is already showing one, and `desktopHeaderNeeds` is what proves that flag
 * cannot be false unless the bar really is carrying it.
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
    expect(body, `${name} renders no ThemeBtn`).toMatch(/<ThemeBtn\b/);
  });

  /* Present is not enough — a toggle behind some OTHER condition satisfies the
     test above and still strands the shopper. The utility bar is the only thing
     allowed to suppress one, and it speaks through exactly these two flags. */
  it.each(anatomies)("%s guards its toggles with the matching ctx flag", (name) => {
    const body = bodyOf(name);
    for (const [btn, flag] of [
      ["ThemeBtn", "needsTheme"],
      ["LangBtn", "needsLang"],
    ] as const) {
      const total = [...body.matchAll(new RegExp(`<${btn}\\b`, "g"))].length;
      const guarded = [
        ...body.matchAll(new RegExp(`\\{ctx\\.${flag} \\? <${btn}\\b`, "g")),
      ].length;
      expect(guarded, `${name}: ${total - guarded} ${btn} not behind ctx.${flag}`).toBe(total);
    }
  });
});

/**
 * **Every anatomy that draws a menu row draws it through `HeaderNav`** — and
 * this is the gap that shipped, twice.
 *
 * The hover control was built against `HeaderNav`, which `classic` and
 * `centered` reach through `CategoryRow`. But `minimal` and `boutique` rendered
 * their own flat row of links, and on those two the hover setting did nothing
 * (found only by loading a real store on `boutique`) — and every dropdown was
 * silently dropped, which is how a merchant's sub-categories vanished from two
 * of six headers (plan `storefront-menu-controls.md`, D2). Nothing failed: the
 * header looked right and the setting saved.
 *
 * So the rule is structural now: no anatomy may render a `<nav>` of its own.
 * `search-first` and `clinical` have no row by design, and reach one through
 * `CategoryRow` only when the merchant asks (`menuDesktop.row`).
 */
describe("every menu row is the shared one", () => {
  it.each(anatomies)("%s draws no menu row of its own", (name) => {
    expect(bodyOf(name)).not.toMatch(/<nav\b/);
  });

  it.each(anatomies)("%s reaches the shared menu", (name) => {
    expect(bodyOf(name)).toMatch(/<HeaderNav\b|<CategoryRow\b/);
  });

  it.each(anatomies)("%s passes no colour to the menu links", (name) => {
    // `linkStyle` is for an anatomy's typography; a colour there would outrank
    // the merchant's hover rule, exactly as the old inline row did.
    const body = bodyOf(name);
    for (const m of body.matchAll(/linkStyle=\{\{([^}]*)\}\}/g)) {
      expect(m[1]).not.toMatch(/color/i);
    }
  });
});
