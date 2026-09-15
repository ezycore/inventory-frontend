// coding-standard: maintained
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  PageSections,
  prepareSections,
  sectionListNeeds,
  type PageSectionInstance,
} from "@/components/storefront-builder/page-sections";
import { heroSlides } from "@/components/storefront-builder/sections/hero";

vi.mock("@/components/storefront-builder/islands/island-map", () => ({
  Island: ({
    name,
    props,
  }: {
    name: string;
    props: { slides?: unknown[]; bare?: boolean; word?: string; fallback?: { title?: string } };
  }) => (
    <span
      data-island={name}
      data-count={props.slides?.length}
      data-bare={props.bare ? "true" : undefined}
      data-word={props.word}
      data-title={props.fallback?.title}
    />
  ),
}));

const image = { url: "https://cdn.example.com/hero.jpg", mediumUrl: "https://cdn.example.com/hero-md.jpg" };

const hero = (settings: unknown, blocks: unknown[]): PageSectionInstance => ({
  id: "hero",
  type: "hero",
  v: 1,
  enabled: true,
  settings,
  blocks,
});

const renderPage = (instances: PageSectionInstance[]) =>
  render(
    <PageSections
      sections={prepareSections(instances)}
      context={{ base: "/shop", storeName: "Rafi's Mart" }}
      data={{}}
    />,
  );

describe("hero", () => {
  it("draws one card slide as server markup: heading, photo and a complete button", () => {
    const { container } = renderPage([
      hero({ layout: "card" }, [
        { id: "s1", settings: { image, badge: "Eid", title: "New season", buttonLabel: "Shop now", link: "/products" } },
      ]),
    ]);
    expect(container.querySelector(".sf-herocard")).not.toBeNull();
    expect(container.querySelector("h1")?.textContent).toBe("New season");
    expect(container.querySelector("img")).not.toBeNull();
    expect([...container.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual(["/shop/products"]);
    expect(container.querySelector("[data-island]")).toBeNull();
  });

  it("keeps a phone link as typed and hides the store's name when a slide has no title", () => {
    const { container } = renderPage([
      hero({ layout: "open", align: "center" }, [
        { id: "s1", settings: { subtitle: "Call to order", buttonLabel: "Call us", link: "tel:+8801711000000" } },
      ]),
    ]);
    const heading = container.querySelector("h1") as HTMLElement;
    expect(heading.className).toBe("sf-visually-hidden");
    expect(heading.textContent).toBe("Rafi's Mart");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("tel:+8801711000000");
  });

  it("draws no button for a label without a link", () => {
    const { container } = renderPage([
      hero({ layout: "card" }, [{ id: "s1", settings: { title: "Hello", buttonLabel: "Go" } }]),
    ]);
    expect(container.querySelectorAll("a")).toHaveLength(0);
  });

  it("rotates two slides in the carousel island, inside the section's frame", () => {
    const { container } = renderPage([
      hero({ layout: "card" }, [
        { id: "s1", settings: { image } },
        { id: "s2", settings: { title: "Second" } },
      ]),
    ]);
    const island = container.querySelector("[data-island]") as HTMLElement;
    expect(island.dataset.island).toBe("hero-carousel");
    expect(island.dataset.count).toBe("2");
    expect(island.dataset.bare).toBe("true");
  });

  it("sends a full-bleed hero to its island, even with one slide", () => {
    const { container } = renderPage([hero({ layout: "full-bleed" }, [{ id: "s1", settings: { image } }])]);
    const island = container.querySelector("[data-island]") as HTMLElement;
    expect(island.dataset.island).toBe("hero-fullbleed");
    expect(island.dataset.count).toBe("1");
  });

  it("drops a slide with neither photo nor text, and a hero left with none", () => {
    const { container } = renderPage([
      hero({ layout: "card" }, [{ id: "s1", settings: { hideTextOnMobile: true } }]),
    ]);
    expect(container.querySelectorAll("section")).toHaveLength(0);
  });

  it("is skipped without a layout it knows", () => {
    expect(prepareSections([hero({ layout: "split" }, [{ id: "s1", settings: { title: "Hi" } }])])).toEqual([]);
  });

  describe("moved from the classic home", () => {
    const banner = { url: "https://cdn.example.com/banner.jpg", mediumUrl: "https://cdn.example.com/banner-md.jpg" };
    const storeHero = { layout: "card", storeBanner: true, storeWords: true, campaignBadge: true, promises: true };
    const renderStore = (instances: PageSectionInstance[]) =>
      render(
        <PageSections
          sections={prepareSections(instances)}
          context={{
            base: "/shop",
            storeName: "Rafi's Mart",
            currency: "BDT",
            banner,
            trustBadges: [{ text: "Cash on delivery" }],
            campaigns: [{ _id: "c1", name: "Eid sale", type: "percentage", value: 10, scope: "storewide" }] as never,
          }}
          data={{}}
        />,
      );

    it("draws the banner hero from an empty slide: store name, banner, offer, both buttons, promises", () => {
      expect(sectionListNeeds(prepareSections([hero(storeHero, [{ id: "b", settings: {} }])]))).toEqual([
        "campaigns",
      ]);
      const { container } = renderStore([hero(storeHero, [{ id: "b", settings: {} }])]);
      const heading = container.querySelector("h1") as HTMLElement;
      expect(heading.textContent).toBe("Rafi's Mart");
      expect(heading.className).toBe("sf-herocard-title");
      expect(container.querySelector("img")?.getAttribute("src")).toContain("banner-md.jpg");
      expect(container.querySelector(".sf-herocard-badge")?.textContent).toBe("Eid sale · 10% ");
      expect(container.querySelector('.sf-herocard-badge [data-word="campaignOff"]')).not.toBeNull();
      const links = [...container.querySelectorAll("a")];
      expect(links.map((a) => a.getAttribute("href"))).toEqual(["/shop/products", "/shop/products"]);
      expect(links.map((a) => a.querySelector("[data-word]")?.getAttribute("data-word"))).toEqual([
        "shopNow",
        "browseCats",
      ]);
      expect(container.querySelector(".sf-herocard-trust")?.textContent).toContain("Cash on delivery");
    });

    it("keeps the merchant's own copy and second button over the store's", () => {
      const { container } = renderStore([
        hero({ ...storeHero, campaignBadge: false, promises: false }, [
          {
            id: "b",
            settings: { title: "Eid edit", buttonLabel: "Buy", link: "/pages/eid", secondaryLabel: "Call", secondaryLink: "tel:+8801711000000" },
          },
        ]),
      ]);
      expect(container.querySelector("h1")?.textContent).toBe("Eid edit");
      expect(container.querySelector(".sf-herocard-badge")).toBeNull();
      expect([...container.querySelectorAll("a")].map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
        ["Buy", "/shop/pages/eid"],
        ["Call", "tel:+8801711000000"],
      ]);
      expect(container.querySelector(".sf-herocard-trust")).toBeNull();
    });

    it("rotates one slide under slideshow, and sends a full-width banner hero to its own island", () => {
      const one = [{ id: "s1", settings: { image } }];
      const { container } = renderStore([hero({ layout: "card", slideshow: true }, one)]);
      expect((container.querySelector("[data-island]") as HTMLElement).dataset.island).toBe("hero-carousel");

      const wide = renderStore([hero({ layout: "full-bleed", storeBanner: true, storeWords: true }, [{ id: "b", settings: {} }])]);
      const island = wide.container.querySelector("[data-island]") as HTMLElement;
      expect(island.dataset.island).toBe("hero-fullbleed-store");
      expect(island.dataset.title).toBe("Rafi's Mart");
    });
  });

  it("maps a slide's focal point per breakpoint onto its desktop and phone anchors", () => {
    const [slide] = heroSlides([
      { id: "s1", settings: { image, focal: { base: { x: 20, y: 30 }, mobile: { x: 70, y: 40 } } } },
    ]);
    expect(slide).toMatchObject({ focal: { x: 20, y: 30 }, mobileFocal: { x: 70, y: 40 } });
  });
});
