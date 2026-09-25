// coding-standard: maintained
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  PageSections,
  prepareSections,
  type PageSectionInstance,
} from "@/components/storefront-builder/page-sections";

vi.mock("@/components/storefront-builder/islands/island-map", () => ({
  Island: ({ name, props }: { name: string; props: unknown }) => (
    <div data-island={name} data-props={JSON.stringify(props)} />
  ),
}));

const section = (id: string, type: string, settings: unknown, blocks?: unknown): PageSectionInstance => ({
  id,
  type,
  v: 1,
  enabled: true,
  settings,
  blocks,
});

const block = (id: string, settings: unknown) => ({ id, settings });

const renderPage = (instances: PageSectionInstance[]) =>
  render(<PageSections sections={prepareSections(instances)} context={{ base: "/shop" }} data={{}} />);

describe("content-body", () => {
  it("hands the page's title, body and date to the store's own content frame", () => {
    const { container } = renderPage([
      section("c1", "content-body", {
        title: "Return policy",
        body: "## Returns\n\nWithin 7 days.",
        updatedAt: "2026-09-01T00:00:00.000Z",
      }),
    ]);
    const island = container.querySelector("[data-island]") as HTMLElement;
    expect(island.dataset.island).toBe("content-frame");
    expect(JSON.parse(island.dataset.props ?? "{}")).toEqual({
      title: "Return policy",
      body: "## Returns\n\nWithin 7 days.",
      updatedAt: "2026-09-01T00:00:00.000Z",
    });
  });

  it("takes no room of its own: the content frame brings its column and padding", () => {
    const [prepared] = prepareSections([section("c1", "content-body", { title: "About", body: "Hi" })]);
    expect(prepared.frame.width).toBe("full");
    expect(prepared.frame.style).toMatchObject({ "--sfb-pt": "0px", "--sfb-pb": "0px" });
  });

  // The section is required and unremovable, so "no body" has to be a STATE of
  // it rather than its absence — and a merchant who builds the page out of the
  // sections around it must not get a blank framed band above them.
  it("draws nothing at all when it has neither a heading nor a body", () => {
    const { container } = renderPage([section("c1", "content-body", {})]);
    expect(container.querySelector("[data-island]")).toBeNull();
  });

  it("counts an emptied rich-text box as empty, document and all", () => {
    const emptied = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });
    const { container } = renderPage([section("c1", "content-body", { body: emptied })]);
    expect(container.querySelector("[data-island]")).toBeNull();
  });

  it("keeps a picture-only body: it says something without saying any words", () => {
    const picture = JSON.stringify({
      type: "doc",
      content: [{ type: "image", attrs: { src: "https://cdn.example.com/a.png" } }],
    });
    const { container } = renderPage([section("c1", "content-body", { body: picture })]);
    expect(container.querySelector("[data-island]")).not.toBeNull();
  });

  it("draws a heading with no body — a page whose content is the sections below it", () => {
    const { container } = renderPage([section("c1", "content-body", { title: "About us" })]);
    const island = container.querySelector("[data-island]") as HTMLElement;
    expect(JSON.parse(island.dataset.props ?? "{}")).toMatchObject({ title: "About us", body: "" });
  });
});

describe("testimonials", () => {
  it("draws each review with its stars and name, and never calls one verified", () => {
    const { container } = renderPage([
      section("t1", "testimonials", { heading: "What customers say" }, [
        block("a", { name: "Rahima", text: "Soft and the colour is exact.", rating: 4 }),
        block("b", { name: "Nadia" }),
      ]),
    ]);
    const cards = container.querySelectorAll("figure");
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toContain("Rahima");
    expect(container.querySelector("[role=img]")?.getAttribute("aria-label")).toBe("4/5");
    expect(container.textContent?.toLowerCase()).not.toContain("verified");
  });

  it("is left out when no review has words or a screenshot", () => {
    const { container } = renderPage([section("t1", "testimonials", {}, [block("a", { name: "Nadia" })])]);
    expect(container.querySelector("section")).toBeNull();
  });
});

describe("benefits and how-to-order", () => {
  it("draws benefit cards with the chosen column count", () => {
    const { container } = renderPage([
      section("b1", "benefits", { columns: 2 }, [
        block("a", { title: "Pure cotton", text: "Breathes in summer." }),
        block("b", { title: "Fast colours", icon: "star" }),
      ]),
    ]);
    const grid = container.querySelector(".sfb-benefits") as HTMLElement;
    // The variable carries the whole TRACK LIST since 2026-09-21, not the count:
    // the stylesheet's `var(…, <the row's own layout>)` fallback is then the
    // unset case, which needs no second selector to detect. See `grid-track.ts`.
    expect(grid.style.getPropertyValue("--sfb-benefit-track")).toBe("repeat(2, minmax(0, 1fr))");
    expect([...container.querySelectorAll("h3")].map((h) => h.textContent)).toEqual(["Pure cotton", "Fast colours"]);
  });

  it("keeps the check fallback on an unset benefit icon and draws none at all on NO_ICON", () => {
    const { container } = renderPage([
      section("b1", "benefits", {}, [
        block("a", { title: "Pure cotton" }),
        block("b", { title: "Fast colours", icon: "none" }),
      ]),
    ]);
    const cards = [...container.querySelectorAll(".sfb-benefits > div")];
    expect(cards[0].querySelectorAll("svg")).toHaveLength(1);
    expect(cards[1].querySelectorAll("svg")).toHaveLength(0);
  });

  it("gives a phone its own column count, which it could not have before", () => {
    // ⚠ `columns` was written into a `min-width: 680px` block, so the one screen
    // the merchant's choice could not reach was the phone — always one column.
    const { container } = renderPage([
      section("b1", "benefits", { columns: { base: 4, mobile: 2 } }, [
        block("a", { title: "Pure cotton" }),
        block("b", { title: "Fast colours" }),
      ]),
    ]);
    const grid = container.querySelector(".sfb-benefits") as HTMLElement;
    expect(grid.style.getPropertyValue("--sfb-benefit-track")).toBe("repeat(4, minmax(0, 1fr))");
    expect(grid.style.getPropertyValue("--sfb-benefit-track-m")).toBe("repeat(2, minmax(0, 1fr))");
  });

  it("keeps the row's own layout when nobody has chosen a count", () => {
    // ⚠ ABSENT, not a computed default: the stylesheet's fallback is what draws
    // an untouched row, on 21 live stores.
    const { container } = renderPage([
      section("b1", "benefits", {}, [block("a", { title: "Pure cotton" }), block("b", { title: "Fast colours" })]),
    ]);
    const grid = container.querySelector(".sfb-benefits") as HTMLElement;
    expect(grid.style.getPropertyValue("--sfb-benefit-track-m")).toBe("");
  });

  it("draws the steps as an ordered list", () => {
    const { container } = renderPage([
      section("h1", "how-to-order", { heading: "How to order" }, [
        block("a", { title: "Choose your product" }),
        block("b", { title: "Fill in the order form" }),
      ]),
    ]);
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
  });
});

describe("video", () => {
  it("hands a YouTube link to the video island with YouTube's own cover", () => {
    const { container } = renderPage([
      section("v1", "video", { url: "https://youtu.be/dQw4w9WgXcQ", label: "How to wear it" }),
    ]);
    const island = container.querySelector("[data-island=video]") as HTMLElement;
    expect(JSON.parse(island.dataset.props ?? "{}")).toEqual({
      embed: { provider: "youtube", id: "dQw4w9WgXcQ" },
      label: "How to wear it",
      poster: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      ratio: "16 / 9",
    });
  });

  it("is left out for a link that is not a YouTube or Facebook video", () => {
    const { container } = renderPage([
      section("v1", "video", { url: "https://vimeo.com/123", label: "Watch" }),
    ]);
    expect(container.querySelector("section")).toBeNull();
  });
});
