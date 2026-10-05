// coding-standard: maintained
import { TooltipProvider } from "@/ui/components/tooltip";
import { renderWithProviders, screen } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

// Radix's Switch and Select measure themselves; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { SectionInspector } from "../section-inspector";
import type { EditorSection } from "../section-instances";
import type { SectionPageContext } from "@/lib/storefront-builder/field-specs";

const inspect = (section: EditorSection, context?: SectionPageContext) =>
  renderWithProviders(
    // A section with repeatable items draws tooltipped item controls, and Radix
    // refuses one outside a provider.
    <TooltipProvider>
      <SectionInspector
        section={section}
        device="desktop"
        context={context}
        onChange={() => {}}
        onAddBlock={() => {}}
        onClose={() => {}}
      />
    </TooltipProvider>,
  );

/**
 * The inspector's two tabs: settings stay where they were under Content, and
 * Style draws the section's box — except for a section pinned to the screen,
 * which has none.
 */
describe("SectionInspector tabs", () => {
  it("opens on Content, and Style shows the box controls", async () => {
    inspect({
      id: "cta-1",
      type: "call-to-action",
      v: 1,
      enabled: true,
      settings: { heading: "Eid", buttonLabel: "Shop", buttonHref: "/products" },
    });
    expect(screen.getByText("Show on")).toBeTruthy();
    expect(screen.queryByText("Spacing")).toBeNull();

    await userEvent.click(screen.getByRole("tab", { name: "Style" }));
    for (const label of ["Background", "Spacing", "Width", "Text alignment", "Text colour"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByText("Show on")).toBeNull();
  });

  it("offers a core section no Width, so it cannot narrow its page on a phone", async () => {
    inspect({ id: "cart", type: "cart-lines", v: 1, enabled: true, settings: {} });
    await userEvent.click(screen.getByRole("tab", { name: "Style" }));
    for (const label of ["Background", "Spacing", "Text alignment", "Text colour"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByText("Width")).toBeNull();
  });

  it("offers a core section no Corners either, because it draws at full width", async () => {
    /* The renderer zeroes a radius at full width (`.sfb-sec[data-width="full"]`)
       and a core section's frame IS full width, so Corners could never do
       anything on the cart, the checkout, the account area, search, a
       collection, a product or a campaign page. It was offered on all of them
       until 2026-09-22: the guard tested the STORED width, which a core section
       can never have — it has no Width control and the API refuses one. */
    inspect({ id: "cart", type: "cart-lines", v: 1, enabled: true, settings: {} });
    await userEvent.click(screen.getByRole("tab", { name: "Style" }));
    expect(screen.queryByText("Corners")).toBeNull();
    // The line stays: an edge-to-edge band can still carry one above and below.
    expect(screen.getByText("Outline")).toBeTruthy();
  });

  it("keeps Corners on an ordinary section, which draws in the page column", async () => {
    inspect({ id: "rt", type: "rich-text", v: 1, enabled: true, settings: {} });
    await userEvent.click(screen.getByRole("tab", { name: "Style" }));
    expect(screen.getByText("Corners")).toBeTruthy();
  });

  it("drops a hero control that does nothing in the layout the merchant picked", () => {
    const hero = (settings: Record<string, unknown>) => ({
      id: "hero-1",
      type: "hero" as const,
      v: 1,
      enabled: true,
      settings,
      blocks: [{ id: "s1", settings: { title: "Eid edit" } }],
    });

    const card = inspect(hero({ layout: "card" }));
    for (const label of ["Show your promises", "Show the running offer as the badge"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    // Never offered anywhere any more: one slide has nothing to rotate to, and
    // two or more rotate without it. See field-visibility.test.ts.
    expect(screen.queryByText("Show as a slideshow")).toBeNull();
    card.unmount();

    /* A full-bleed hero has no card to put promises under, no second button and
       no badge, and it never reads the slideshow flag — so none of them is
       offered. The stored values stay: see field-visibility.test.ts. */
    const wide = inspect(hero({ layout: "full-bleed" }));
    for (const label of [
      "Show your promises",
      "Show as a slideshow",
      "Show the running offer as the badge",
      "Second button label",
      "Use the store's wording",
    ]) {
      expect(screen.queryByText(label)).toBeNull();
    }
    wide.unmount();

    // …except the wording, which a full-bleed hero DOES read once it is drawn
    // as the store's banner hero.
    inspect(hero({ layout: "full-bleed", storeBanner: true }));
    expect(screen.getByText("Use the store's wording")).toBeTruthy();
  });

  it("offers the hero no Text alignment, because it has one of its own", async () => {
    inspect({
      id: "hero-1",
      type: "hero",
      v: 1,
      enabled: true,
      settings: { layout: "card" },
      blocks: [{ id: "s1", settings: { title: "Eid edit" } }],
    });
    await userEvent.click(screen.getByRole("tab", { name: "Style" }));
    for (const label of ["Background", "Spacing", "Width", "Text colour"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    // Two controls for one question, and on a card the Style one only ever
    // centred half of it. The Content tab's Alignment is the answer now.
    expect(screen.queryByText("Text alignment")).toBeNull();
  });

  it("says a pinned section has no box to style", async () => {
    inspect({ id: "bar-1", type: "sticky-order-bar", v: 1, enabled: true, settings: {} });
    await userEvent.click(screen.getByRole("tab", { name: "Style" }));
    expect(screen.getByText(/pinned to the screen/)).toBeTruthy();
    expect(screen.queryByText("Spacing")).toBeNull();
  });
});

describe("SectionInspector — Show on", () => {
  it("offers both screens for a merchant's own section", () => {
    inspect({
      id: "cta",
      type: "call-to-action",
      v: 1,
      enabled: true,
      settings: { heading: "Need help?", buttonLabel: "Message us", buttonHref: "/pages/faq" },
    });
    expect(screen.getByText("Show on")).toBeTruthy();
    expect(screen.getByLabelText("Phones")).toBeTruthy();
  });

  it("does not offer to hide a core section on either screen", () => {
    // The storefront skips a section hidden for a screen — a cart shown on
    // computers only is a phone shop with no cart — so the switch is not offered.
    inspect({ id: "cart", type: "cart-lines", v: 1, enabled: true, settings: {} });
    expect(screen.queryByText("Show on")).toBeNull();
    expect(screen.queryByLabelText("Phones")).toBeNull();
    expect(screen.queryByLabelText("Computers and tablets")).toBeNull();
  });
});

describe("SectionInspector — the product page's own product", () => {
  it("offers no product picker on the product page, and does not call the section unfinished", () => {
    inspect({ id: "offer", type: "offer-pricing", v: 1, enabled: true, settings: {} }, "product");
    expect(screen.getByText("Product: the one this page shows.")).toBeTruthy();
    expect(screen.queryByText(/Fill in the fields marked/)).toBeNull();
  });

  it("still asks for the product on a landing page", () => {
    inspect({ id: "offer", type: "offer-pricing", v: 1, enabled: true, settings: {} }, "landing");
    expect(screen.queryByText("Product: the one this page shows.")).toBeNull();
    expect(screen.getByText(/Fill in the fields marked/)).toBeTruthy();
  });

  it("offers the product section's switch for its own related row", () => {
    inspect({ id: "main", type: "product-main", v: 1, enabled: true, settings: {} }, "product");
    expect(screen.getByText("Hide “You may also like”")).toBeTruthy();
  });
});

describe("SectionInspector — number settings", () => {
  it("ties a number box to its label, so the label names it and focuses it", async () => {
    inspect({ id: "related", type: "related-products", v: 1, enabled: true, settings: {} }, "product");
    const box = screen.getByLabelText("Number of products");
    expect(box.tagName).toBe("INPUT");
    await userEvent.click(screen.getByText("Number of products"));
    expect(document.activeElement).toBe(box);
  });
});

describe("SectionInspector — a switch whose section draws it on", () => {
  /* Found in the browser: Show names sat OFF over a row of named tiles, because
     the control read `value === true` while the section read `?? true`. The
     first click then wrote the `true` already in force and changed nothing. */
  it("shows an unset Show names ON, as the tiles draw it", () => {
    inspect({ id: "t1", type: "category-tiles", v: 1, enabled: true, settings: {} });
    expect(screen.getByLabelText("Show names").getAttribute("data-state")).toBe("checked");
  });

  it("still shows an explicit off as off", () => {
    inspect({
      id: "t1",
      type: "category-tiles",
      v: 1,
      enabled: true,
      settings: { showLabels: false },
    });
    expect(screen.getByLabelText("Show names").getAttribute("data-state")).toBe("unchecked");
  });

  it("leaves a switch with no such default off", () => {
    inspect({ id: "t1", type: "category-tiles", v: 1, enabled: true, settings: {} });
    expect(screen.getByLabelText("Hide the description").getAttribute("data-state")).toBe(
      "unchecked",
    );
  });
});

describe("SectionInspector — the icon picker", () => {
  /* A dropdown of names asked the merchant to imagine each shape one row at a
     time, and had nowhere to say "no icon at all" — unset draws a fallback on
     every surface, so taking a disc off was impossible until `NO_ICON`. */
  const promisesBand = (blockSettings: Record<string, unknown>) => ({
    id: "pb",
    type: "promises-band" as const,
    v: 1,
    enabled: true,
    settings: {},
    blocks: [{ id: "b1", settings: { text: "Cash on delivery", ...blockSettings } }],
  });

  const inspectSaving = (section: EditorSection, onChange: (next: EditorSection) => void) =>
    renderWithProviders(
      <TooltipProvider>
        <SectionInspector
          section={section}
          device="desktop"
          onChange={onChange}
          onAddBlock={() => {}}
          onClose={() => {}}
        />
      </TooltipProvider>,
    );

  it("names what an unset promise icon does rather than guessing a glyph, and offers the shapes", async () => {
    inspectSaving(promisesBand({}), () => {});
    // Labelled by its field, like every other control here — so the glyph in
    // force is read off the trigger's own text.
    const trigger = screen.getByLabelText("Icon");
    expect(trigger.textContent).toContain("The band decides");
    await userEvent.click(trigger);
    expect(screen.getByRole("button", { name: "Truck" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Lightning" })).toBeTruthy();
  });

  it("stores No icon as a value, because unset is the cycled fallback", async () => {
    let saved: EditorSection | undefined;
    inspectSaving(promisesBand({}), (next) => {
      saved = next;
    });
    await userEvent.click(screen.getByLabelText("Icon"));
    await userEvent.click(screen.getByRole("button", { name: "No icon" }));
    expect(saved?.blocks?.[0].settings.icon).toBe("none");
  });

  it("shows a benefit card's fixed fallback as the value it draws, with no unset choice", async () => {
    inspectSaving(
      { id: "b1", type: "benefits", v: 1, enabled: true, settings: {}, blocks: [{ id: "x", settings: { title: "Pure cotton" } }] },
      () => {},
    );
    const trigger = screen.getByLabelText("Icon");
    expect(trigger.textContent).toContain("Check");
    await userEvent.click(trigger);
    expect(screen.queryByRole("button", { name: "Default" })).toBeNull();
    expect(screen.getByRole("button", { name: "No icon" })).toBeTruthy();
  });
});

describe("SectionInspector — a product part on some products", () => {
  const FOLD = { id: "fold-1", settings: { part: "collapsible", title: "Size chart" } };
  const main = (blocks: EditorSection["blocks"]): EditorSection => ({
    id: "main",
    type: "product-main",
    v: 1,
    enabled: true,
    settings: {},
    blocks,
  });
  const productsField = () => screen.queryByText("Products", { selector: "label" });

  it("offers Products on a collapsible part, starting on every product", async () => {
    inspect(main([{ id: "part-buy", settings: { part: "buy" } }, FOLD]), "product");
    await userEvent.click(screen.getByRole("button", { name: /^Size chart/ }));
    expect(productsField()).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "Products" }).textContent).toContain("Every product");
  });

  it("offers it on no part that is the product's own", async () => {
    inspect(main([{ id: "part-price", settings: { part: "price" } }, { id: "part-buy", settings: { part: "buy" } }]), "product");
    await userEvent.click(screen.getByRole("button", { name: /^Price/ }));
    expect(productsField()).toBeNull();
  });

  it("marks a limited part in the list", () => {
    inspect(
      main([
        { id: "part-buy", settings: { part: "buy" } },
        { ...FOLD, settings: { ...FOLD.settings, categoryIds: ["64b7f0c2a1b2c3d4e5f60720"] } },
      ]),
      "product",
    );
    expect(screen.getByText("Collapsible text · On some products")).toBeTruthy();
  });
});
