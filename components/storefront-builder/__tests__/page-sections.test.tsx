// coding-standard: maintained
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { CatalogProduct } from "@/lib/storefront-client";
import {
  PageSections,
  prepareSections,
  sectionDataRequests,
  type PageSectionInstance,
} from "@/components/storefront-builder/page-sections";

vi.mock("@/components/storefront-builder/islands/island-map", () => ({
  Island: ({ name, props }: { name: string; props: { products: unknown[] } }) => (
    <div data-island={name} data-count={props.products.length} />
  ),
}));

const cta = (overrides: Partial<PageSectionInstance> = {}): PageSectionInstance => ({
  id: "cta1",
  type: "call-to-action",
  v: 1,
  enabled: true,
  settings: { heading: "Eid offer", buttonLabel: "Order now", buttonHref: "/pages/eid" },
  ...overrides,
});

const context = { base: "/shop", currency: "BDT" };

const renderPage = (instances: PageSectionInstance[], data = {}) =>
  render(<PageSections sections={prepareSections(instances)} context={context} data={data} />);

/**
 * X2 — six sections carry a built-in column (`rich-text` and `faq` at 780px,
 * `selected-products` and `collections-row` at 980, `order-form` at 560,
 * `video` at 880/420) that until 2026-09-21 silently beat the Style tab's own
 * Width control. They keep it only where the merchant chose no width, which the
 * section element says with `data-styled-width` and the stylesheet acts on.
 */
describe("a section's own column against the Style tab's Width", () => {
  const richText = (style?: unknown): PageSectionInstance => ({
    id: "rt1",
    type: "rich-text",
    v: 1,
    enabled: true,
    settings: { body: JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] }) },
    ...(style ? { style } : {}),
  });

  it("keeps the section's own column while no width is chosen", () => {
    const { container } = renderPage([richText()]);
    const section = container.querySelector(".sfb-sec") as HTMLElement;
    // ⚠ The ABSENCE is the assertion: no attribute means the stylesheet's
    // `.sfb-own-column` cap still applies, which is today's rendering exactly.
    expect(section.hasAttribute("data-styled-width")).toBe(false);
    const column = container.querySelector(".sfb-own-column") as HTMLElement;
    expect(column.getAttribute("style")).toContain("--sfb-own-column: 780px");
  });

  it("stands aside once the merchant picks one — including an explicit Page column", () => {
    for (const width of ["content", "wide", "full"]) {
      const { container } = renderPage([richText({ width })]);
      const section = container.querySelector(".sfb-sec") as HTMLElement;
      expect(section.hasAttribute("data-styled-width")).toBe(true);
      // The section still declares its own number; the stylesheet is what
      // stops applying it, so nothing has to be recomputed per section.
      expect(container.querySelector(".sfb-own-column")).not.toBeNull();
    }
  });

  it("is not fooled by a stored width the frame refuses", () => {
    const { container } = renderPage([richText({ width: "enormous" })]);
    expect((container.querySelector(".sfb-sec") as HTMLElement).hasAttribute("data-styled-width")).toBe(false);
  });
});

describe("prepareSections", () => {
  it("skips instances that cannot render, without breaking the rest", () => {
    const prepared = prepareSections([
      cta({ id: "off", enabled: false }),
      cta({ id: "unknown", type: "not-a-section" }),
      cta({ id: "future", v: 2 }),
      cta({ id: "broken", settings: { heading: "Hi", buttonLabel: "Go", buttonHref: "javascript:alert(1)" } }),
      cta({ id: "hidden", visibility: { desktop: false, mobile: false } }),
      cta({ id: "proto", type: "__proto__" }),
      cta({ id: "ok" }),
    ]);
    expect(prepared.map((section) => section.id)).toEqual(["ok"]);
  });

  it("marks a section hidden on one breakpoint", () => {
    const [section] = prepareSections([cta({ visibility: { mobile: false } })]);
    expect(section.hide).toBe("mobile");
  });

  it("collects one catalogue query per product grid and drops grids with no source", () => {
    const prepared = prepareSections([
      { id: "g1", type: "product-grid", v: 1, enabled: true, settings: { source: "newest", limit: 8 } },
      { id: "g2", type: "product-grid", v: 1, enabled: true, settings: { source: "category", limit: 8 } },
      cta(),
    ]);
    expect(prepared.map((section) => section.id)).toEqual(["g1", "cta1"]);
    expect(sectionDataRequests(prepared)).toEqual([
      { key: "g1", type: "products", source: "newest", limit: 8, inStock: true },
    ]);
  });
});

describe("PageSections", () => {
  it("resolves store links against the base and leaves tel: links alone", () => {
    const { container } = renderPage([
      cta(),
      cta({ id: "call", settings: { heading: "Call us", buttonLabel: "Call", buttonHref: "tel:+8801711000000" } }),
    ]);
    const links = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(links).toEqual(["/shop/pages/eid", "tel:+8801711000000"]);
  });

  it("wraps each section in the frame with its style properties", () => {
    const { container } = renderPage([
      cta({ style: { width: "full", textTone: "light", padding: { base: { top: "none", bottom: "xl" } } } }),
    ]);
    const section = container.querySelector("section.sfb-sec") as HTMLElement;
    expect(section.dataset.width).toBe("full");
    expect(section.dataset.tone).toBe("light");
    expect(section.style.getPropertyValue("--sfb-pt")).toBe("0px");
  });

  it("renders FAQ items as native details with a matching FAQPage node", () => {
    const { container } = renderPage([
      {
        id: "faq1",
        type: "faq",
        v: 1,
        enabled: true,
        settings: { heading: "Questions" },
        blocks: [
          { id: "q1", settings: { question: "Cash on delivery?", answer: "Yes, everywhere." } },
          { id: "q1", settings: { question: "Repeated id", answer: "Skipped." } },
          { id: "q2", settings: { question: "", answer: "Invalid question, skipped." } },
        ],
      },
    ]);
    expect(container.querySelectorAll("details")).toHaveLength(1);
    const jsonLd = JSON.parse(container.querySelector('script[type="application/ld+json"]')?.innerHTML ?? "{}");
    expect(jsonLd["@type"]).toBe("FAQPage");
    expect(jsonLd.mainEntity).toHaveLength(1);
  });

  it("leaves out a section with nothing to show", () => {
    const { container } = renderPage([
      { id: "faq1", type: "faq", v: 1, enabled: true, settings: {}, blocks: [] },
      { id: "g1", type: "product-grid", v: 1, enabled: true, settings: { source: "newest", limit: 8 } },
    ]);
    expect(container.querySelectorAll("section")).toHaveLength(0);
  });

  it("hands a product grid's data to the product-cards island", () => {
    const items = [{ _id: "p1" }, { _id: "p2" }] as CatalogProduct[];
    const { container } = renderPage(
      [{ id: "g1", type: "product-grid", v: 1, enabled: true, settings: { source: "newest", limit: 8, heading: "New" } }],
      { g1: { items } },
    );
    const island = container.querySelector("[data-island]") as HTMLElement;
    expect(island.dataset.island).toBe("product-cards");
    expect(island.dataset.count).toBe("2");
    expect(container.textContent).toContain("New");
  });
});
