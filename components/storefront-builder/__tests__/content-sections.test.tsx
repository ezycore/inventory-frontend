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
    expect(grid.style.getPropertyValue("--sfb-benefit-cols")).toBe("2");
    expect([...container.querySelectorAll("h3")].map((h) => h.textContent)).toEqual(["Pure cotton", "Fast colours"]);
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
