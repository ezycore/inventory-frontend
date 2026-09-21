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
