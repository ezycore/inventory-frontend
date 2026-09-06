// coding-standard: maintained
import { describe, expect, it } from "vitest";
import {
  MAX_MOBILE_TABS,
  MAX_SLOT_ACTIONS,
  MOBILE_ACTIONS,
  MOBILE_TEMPLATES,
  MOBILE_TEMPLATE_OPTIONS,
  canBrowse,
  chromeHas,
  mobileIcon,
  mobileOverrides,
  mobileTemplate,
  resolveMobileChrome,
} from "@/lib/storefront-mobile";
import { TEMPLATE_OPTIONS } from "@/components/ecommerce/customize/template-options";
import { SKETCH_KEYS } from "@/components/ecommerce/customize/template-sketch";
import { READY_MADE_THEMES } from "@/lib/storefront-themes";

describe("the default template is the chrome the storefront already shipped", () => {
  /**
   * **The one test that protects every existing shop.** `tabs` is what every
   * storefront rendered before this axis existed, so a store with nothing stored
   * has to resolve to exactly it — a drift here silently re-chromes the whole
   * platform, and none of those merchants asked for a new phone header.
   */
  it("resolves an untouched store to the old bar and the old tabs", () => {
    const chrome = resolveMobileChrome(undefined, undefined);
    expect(chrome.template).toBe("tabs");
    expect(chrome.left).toEqual([]);
    expect(chrome.right).toEqual(["lang", "theme"]);
    expect(chrome.brand).toBe("left");
    expect(chrome.row).toBe("search");
    expect(chrome.searchInline).toBe(false);
    expect(chrome.tabs).toEqual(["home", "menu", "cart", "account"]);
    expect(chrome.menuStyle).toBe("sheet");
  });

  it("is what an unknown or retired template id falls back to", () => {
    expect(resolveMobileChrome({ mobile: "no-such-template" }, undefined).template)
      .toBe("tabs");
    expect(mobileTemplate(undefined).id).toBe("tabs");
  });
});

describe("stored values are narrowed before they reach the DOM", () => {
  it("drops action ids it does not know", () => {
    const chrome = resolveMobileChrome(
      { mobile: "drawer" },
      { left: ["menu", "wishlist", "definitely-not-real"] },
    );
    expect(chrome.left).toEqual(["menu"]);
  });

  it("drops duplicates, which would mount two components on one key", () => {
    const chrome = resolveMobileChrome({ mobile: "drawer" }, {
      right: ["cart", "cart", "search"],
    });
    expect(chrome.right).toEqual(["cart", "search"]);
  });

  it("caps the slots and the tab row at what a phone can draw", () => {
    const chrome = resolveMobileChrome({ mobile: "drawer" }, {
      left: ["menu", "search", "cart", "account", "home"],
      tabs: ["home", "menu", "search", "cart", "account", "call", "track"],
    });
    expect(chrome.left).toHaveLength(MAX_SLOT_ACTIONS);
    expect(chrome.tabs).toHaveLength(MAX_MOBILE_TABS);
  });

  it("refuses a glyph the action does not offer", () => {
    // A hamburger drawn as a printer is not customisation.
    const chrome = resolveMobileChrome({ mobile: "drawer" }, {
      icons: { menu: "printer", cart: "bag" },
    });
    expect(mobileIcon(chrome, "menu")).toBe("menu");
    expect(mobileIcon(chrome, "cart")).toBe("bag");
  });

  it("clamps a logo height rather than ignoring the number typed", () => {
    expect(resolveMobileChrome({}, { logoHeight: 400 }).logoHeight).toBe(60);
    expect(resolveMobileChrome({}, { logoHeight: 2 }).logoHeight).toBe(18);
  });

  it("treats an empty tab list as a real answer, not as unset", () => {
    // `tabs` starts with four; a merchant who removes them all must GET none.
    const chrome = resolveMobileChrome({ mobile: "tabs" }, { tabs: [] });
    expect(chrome.tabs).toEqual([]);
  });
});

describe("only the difference is stored", () => {
  it("stores nothing for a template left alone", () => {
    for (const template of MOBILE_TEMPLATES) {
      const chrome = resolveMobileChrome({ mobile: template.id }, undefined);
      expect(mobileOverrides(template.id, chrome)).toBeUndefined();
    }
  });

  it("stores only the field that moved", () => {
    const chrome = resolveMobileChrome({ mobile: "drawer" }, undefined);
    expect(mobileOverrides("drawer", { ...chrome, sticky: false })).toEqual({
      sticky: false,
    });
  });

  it("stops recording an icon set back to the template's own", () => {
    const chrome = resolveMobileChrome({ mobile: "drawer" }, { icons: { cart: "bag" } });
    expect(mobileOverrides("drawer", chrome)).toEqual({ icons: { cart: "bag" } });
    expect(
      mobileOverrides("drawer", { ...chrome, icons: { cart: "cart" } }),
    ).toBeUndefined();
  });

  it("round-trips: resolve(diff(x)) === x", () => {
    const edited = {
      ...resolveMobileChrome({ mobile: "browse" }, undefined),
      left: ["menu", "search"] as const,
      tabs: [] as const,
      logoHeight: 44,
      icons: { menu: "grid" } as const,
    };
    const stored = mobileOverrides("browse", { ...edited, left: [...edited.left], tabs: [] });
    const back = resolveMobileChrome({ mobile: "browse" }, stored);
    expect(back.left).toEqual(["menu", "search"]);
    expect(back.tabs).toEqual([]);
    expect(back.logoHeight).toBe(44);
    expect(mobileIcon(back, "menu")).toBe("grid");
  });
});

describe("every template is reachable and drawable", () => {
  it("has a unique id and a merchant-facing sentence", () => {
    const ids = MOBILE_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of MOBILE_TEMPLATES) {
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
    }
  });

  /**
   * The point of the whole design: the admin picker is DERIVED from the
   * registry, so a template added there needs no second edit to be selectable.
   * This asserts the derivation is actually still in place.
   */
  it("reaches the Customize picker without a second list", () => {
    expect(TEMPLATE_OPTIONS.mobile.map((o) => o.value)).toEqual(
      MOBILE_TEMPLATES.map((t) => t.id),
    );
    expect(MOBILE_TEMPLATE_OPTIONS).toHaveLength(MOBILE_TEMPLATES.length);
  });

  it("has a wireframe, so no tile in the picker is a blank box", () => {
    const drawn = new Set(SKETCH_KEYS);
    const missing = MOBILE_TEMPLATES.filter((t) => !drawn.has(`mobile:${t.id}`));
    expect(missing.map((t) => t.id)).toEqual([]);
  });

  it("only places actions the registry knows and the renderer can draw", () => {
    const known = new Set(MOBILE_ACTIONS.map((a) => a.id));
    for (const t of MOBILE_TEMPLATES) {
      for (const id of [...t.left, ...t.right, ...t.tabs]) {
        expect(known.has(id)).toBe(true);
      }
      // Slots are capped by the resolver; a template must not ship over it.
      expect(t.left.length).toBeLessThanOrEqual(MAX_SLOT_ACTIONS);
      expect(t.right.length).toBeLessThanOrEqual(MAX_SLOT_ACTIONS);
      expect(t.tabs.length).toBeLessThanOrEqual(MAX_MOBILE_TABS);
    }
  });

  /**
   * A centred logo has no room beside it, so the renderer does not draw an
   * inline search field in that arrangement — a template shipping both would
   * promise a control the shop never draws.
   */
  it("never ships a centred logo with an in-bar search field", () => {
    for (const t of MOBILE_TEMPLATES) {
      expect(t.brand === "center" && t.searchInline).toBe(false);
    }
  });

  /**
   * **The dead-end guard, and it has already earned its place.** `minimal`
   * shipped as "logo and cart, navigation lives on the page" and this test
   * failed it: the menu panel is the only category navigation a phone has, so
   * that bar left a shopper on the home page with nowhere to go but the cart.
   * The template now carries a menu button.
   */
  it("gives every template a way into the catalogue", () => {
    for (const t of MOBILE_TEMPLATES) {
      const chrome = resolveMobileChrome({ mobile: t.id }, undefined);
      expect(canBrowse(chrome)).toBe(true);
    }
  });

  /**
   * The other half of the same rule: what the bar leaves out, the menu panel
   * puts back. `chromeHas` is the question it asks — a template with no account
   * button and no Account tab must be one the panel adds the row for.
   */
  it("reports what the panel has to carry itself", () => {
    const minimal = resolveMobileChrome({ mobile: "minimal" }, undefined);
    expect(chromeHas(minimal, "account")).toBe(false);
    expect(chromeHas(minimal, "lang")).toBe(false);
    const tabs = resolveMobileChrome({ mobile: "tabs" }, undefined);
    expect(chromeHas(tabs, "account")).toBe(true);
    expect(chromeHas(tabs, "lang")).toBe(true);
  });
});

describe("ready-made themes", () => {
  it("each stamp a mobile template that exists", () => {
    const ids = new Set(MOBILE_TEMPLATES.map((t) => t.id));
    for (const theme of READY_MADE_THEMES) {
      expect(ids.has(theme.templates.mobile)).toBe(true);
    }
  });

  it("Classic resets to the storefront's own chrome", () => {
    const classic = READY_MADE_THEMES.find((t) => t.id === "classic");
    expect(classic?.templates.mobile).toBe("tabs");
  });
});
