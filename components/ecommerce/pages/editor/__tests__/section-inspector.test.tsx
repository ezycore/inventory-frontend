// coding-standard: maintained
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
    <SectionInspector
      section={section}
      device="desktop"
      context={context}
      onChange={() => {}}
      onAddBlock={() => {}}
      onClose={() => {}}
    />,
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
