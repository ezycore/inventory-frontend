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
    props: {
      slides?: unknown[];
      bare?: boolean;
      word?: string;
      fallback?: { title?: string };
      layout?: string;
      align?: string;
      promises?: string[];
      campaignLabel?: string;
    };
  }) => (
    <span
      data-island={name}
      data-count={props.slides?.length}
      data-bare={props.bare ? "true" : undefined}
      data-word={props.word}
      data-title={props.fallback?.title}
      data-layout={props.layout}
      data-align={props.align}
      data-promises={props.promises?.join("|")}
      data-campaign={props.campaignLabel}
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

  it("draws a button for a label without a link, pointed at the catalogue", () => {
    const { container } = renderPage([
      hero({ layout: "card" }, [{ id: "s1", settings: { title: "Hello", buttonLabel: "Go" } }]),
    ]);
    // It used to draw nothing here while every other hero drew a button.
    const links = [...container.querySelectorAll("a")];
    expect(links.map((a) => a.textContent)).toEqual(["Go"]);
    expect(links[0].getAttribute("href")).toBe("/shop/products");
    // The button is the target, so the whole-hero link stays away.
    expect(container.querySelector(".sf-hero-slide-link")).toBeNull();
  });

  it("makes the whole hero the link for a link without a label, as the islands do", () => {
    const { container } = renderPage([
      hero({ layout: "card" }, [{ id: "s1", settings: { image, title: "Hello", link: "/sale" } }]),
    ]);
    const link = container.querySelector(".sf-hero-slide-link") as HTMLElement;
    expect(link.getAttribute("href")).toBe("/shop/sale");
    expect(link.getAttribute("aria-label")).toBe("Hello");
  });

  it("leaves the hero inert where a button already carries the link", () => {
    const { container } = renderPage([
      hero({ layout: "open" }, [
        { id: "s1", settings: { title: "Hello", buttonLabel: "Shop", link: "/sale" } },
      ]),
    ]);
    // Two overlapping hit areas is the worse answer, and the whole-hero link
    // would paint over the button and swallow its press.
    expect(container.querySelector(".sf-hero-slide-link")).toBeNull();
    expect(container.querySelectorAll("a")).toHaveLength(1);
  });

  it("marks a static hero that hides its copy on phones, in both layouts", () => {
    const slide = { id: "s1", settings: { image, title: "Hello", hideTextOnMobile: true } };
    const card = renderPage([hero({ layout: "card" }, [slide])]);
    expect(
      card.container.querySelector(".sf-herocard")?.getAttribute("data-hide-mobile-copy"),
    ).toBe("true");
    const open = renderPage([hero({ layout: "open" }, [slide])]);
    expect(
      open.container.querySelector(".sf-heroopen")?.getAttribute("data-hide-mobile-copy"),
    ).toBe("true");
  });

  it("rotates two slides in the shape the merchant chose, not in the dark carousel", () => {
    const { container } = renderPage([
      hero({ layout: "card" }, [
        { id: "s1", settings: { image } },
        { id: "s2", settings: { title: "Second" } },
      ]),
    ]);
    const island = container.querySelector("[data-island]") as HTMLElement;
    expect(island.dataset.island).toBe("hero-slides");
    expect(island.dataset.count).toBe("2");
    expect(island.dataset.layout).toBe("card");
  });

  it("keeps an open hero open when it rotates", () => {
    const { container } = renderPage([
      hero({ layout: "open" }, [
        { id: "s1", settings: { title: "First" } },
        { id: "s2", settings: { title: "Second" } },
      ]),
    ]);
    const island = container.querySelector("[data-island]") as HTMLElement;
    expect(island.dataset.island).toBe("hero-slides");
    expect(island.dataset.layout).toBe("open");
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
      // …and not for a full-bleed hero, which never draws the badge (R2).
      expect(
        sectionListNeeds(
          prepareSections([hero({ ...storeHero, layout: "full-bleed" }, [{ id: "b", settings: {} }])]),
        ),
      ).toEqual([]);
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

    it("keeps a single slide on the server under slideshow, and sends a full-width banner hero to its own island", () => {
      const one = [{ id: "s1", settings: { image } }];
      const { container } = renderStore([hero({ layout: "card", slideshow: true }, one)]);
      /* One slide has nothing to rotate to. Under the old dark carousel the
         toggle turned this into a different section; now it would draw the same
         card the server already draws, only client-side — so nothing reads it
         and the card stays server markup. */
      expect(container.querySelector("[data-island]")).toBeNull();
      expect(container.querySelector(".sf-herocard")).not.toBeNull();

      const wide = renderStore([hero({ layout: "full-bleed", storeBanner: true, storeWords: true }, [{ id: "b", settings: {} }])]);
      const island = wide.container.querySelector("[data-island]") as HTMLElement;
      expect(island.dataset.island).toBe("hero-fullbleed-store");
      // The copy rides on the slides now, not on a flattened fallback: the
      // island is what turns an empty first slide into the store's name.
      expect(island.dataset.title).toBeUndefined();
      expect(island.dataset.count).toBe("1");
    });

    it("hands the banner hero every slide, not just the first", () => {
      const wide = renderStore([
        hero({ layout: "full-bleed", storeBanner: true }, [
          { id: "s1", settings: { image } },
          { id: "s2", settings: { title: "Second" } },
          { id: "s3", settings: { title: "Third" } },
        ]),
      ]);
      const island = wide.container.querySelector("[data-island]") as HTMLElement;
      expect(island.dataset.island).toBe("hero-fullbleed-store");
      expect(island.dataset.count).toBe("3");
    });

    it("hands the rotating card its promises and the running offer, as plain data", () => {
      const { container } = renderStore([
        hero(storeHero, [
          { id: "s1", settings: { title: "First" } },
          { id: "s2", settings: { title: "Second" } },
        ]),
      ]);
      const island = container.querySelector("[data-island]") as HTMLElement;
      expect(island.dataset.island).toBe("hero-slides");
      expect(island.dataset.promises).toBe("Cash on delivery");
      // Text, not a finished badge: the word "off" is the shopper's, and an
      // island's props cross the server → client boundary.
      expect(island.dataset.campaign).toBe("Eid sale · 10%");
    });

    it("gives an open hero no promises, which only a card draws", () => {
      const { container } = renderStore([
        hero({ ...storeHero, layout: "open" }, [
          { id: "s1", settings: { title: "First" } },
          { id: "s2", settings: { title: "Second" } },
        ]),
      ]);
      expect((container.querySelector("[data-island]") as HTMLElement).dataset.promises).toBe("");
    });
  });

  it("centres every layout, not just the open one", () => {
    const slide = [{ id: "s1", settings: { image, title: "Hello" } }];
    const card = renderPage([hero({ layout: "card", align: "center" }, slide)]);
    expect(card.container.querySelector(".sf-herocard")?.getAttribute("data-align")).toBe("center");

    const wide = renderPage([hero({ layout: "full-bleed", align: "center" }, slide)]);
    expect((wide.container.querySelector("[data-island]") as HTMLElement).dataset.align).toBe("center");

    // Left is the default and marks nothing, so a hero left alone is untouched.
    const plain = renderPage([hero({ layout: "card" }, slide)]);
    expect(plain.container.querySelector(".sf-herocard")?.getAttribute("data-align")).toBeNull();
  });

  it("carries a slide's second button through to the rotating hero", () => {
    const [, second] = heroSlides([
      { id: "s1", settings: { title: "First" } },
      { id: "s2", settings: { title: "Second", secondaryLabel: "Call", secondaryLink: "tel:+8801711000000" } },
    ]);
    // Decision D3: it is read per slide now, not from the first one alone.
    expect(second).toMatchObject({ secondaryLabel: "Call", secondaryLink: "tel:+8801711000000" });
  });

  it("maps a slide's focal point per breakpoint onto its desktop and phone anchors", () => {
    const [slide] = heroSlides([
      { id: "s1", settings: { image, focal: { base: { x: 20, y: 30 }, mobile: { x: 70, y: 40 } } } },
    ]);
    expect(slide).toMatchObject({ focal: { x: 20, y: 30 }, mobileFocal: { x: 70, y: 40 } });
  });
});
