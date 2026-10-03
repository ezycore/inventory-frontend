// coding-standard: maintained
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  PageSections,
  prepareSections,
  sectionListNeeds,
  type PageSectionInstance,
} from "@/components/storefront-builder/page-sections";
import { heroSlides, pickCampaign } from "@/components/storefront-builder/sections/hero";

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
      mobileCopy?: string;
      frame?: {
        vars?: Record<string, string>;
        base?: boolean;
        mobile?: boolean;
        heightBase?: boolean;
        heightMobile?: boolean;
      };
      placement?: { side?: string; mobileFirst?: string };
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
      data-mobile-copy={props.mobileCopy}
      data-frame-vars={props.frame ? JSON.stringify(props.frame.vars) : undefined}
      data-frame-base={props.frame?.base ? "true" : undefined}
      data-frame-mobile={props.frame?.mobile ? "true" : undefined}
      data-h={props.frame?.heightBase ? "" : undefined}
      data-h-m={props.frame?.heightMobile ? "" : undefined}
      data-side={props.placement?.side}
      data-first={props.placement?.mobileFirst}
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

describe("pickCampaign", () => {
  const offer = (id: string, scope: string, endsAt?: string) =>
    ({ _id: id, name: id, type: "percentage", value: 10, scope, endsAt }) as never;

  it("leads with the storewide offer, then the one ending soonest", () => {
    const running = [
      offer("late", "category", "2026-10-30T00:00:00Z"),
      offer("soon", "category", "2026-10-01T00:00:00Z"),
      offer("open", "category"),
    ];
    expect(pickCampaign(running)?._id).toBe("soon");
    expect(pickCampaign([...running, offer("store", "storewide", "2026-12-01T00:00:00Z")])?._id).toBe("store");
    expect(pickCampaign([])).toBeUndefined();
  });

  it("names only the picked offer, and nothing when it is not running", () => {
    const running = [offer("a", "storewide"), offer("b", "product")];
    expect(pickCampaign(running, "b")?._id).toBe("b");
    expect(pickCampaign(running, "gone")).toBeUndefined();
  });
});

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

  describe("picture shape", () => {
    const frameOf = (settings: Record<string, unknown>) => {
      const { container } = renderPage([
        hero(settings, [{ id: "s1", settings: { image, title: "Eid" } }]),
      ]);
      const root =
        container.querySelector("[data-island]") ??
        (container.querySelector(".sf-herocard, .sf-heroopen") as HTMLElement | null);
      return root;
    };

    it("leaves every layout untouched when the merchant chose no shape", () => {
      // No attribute, no variable, so the stylesheet keeps drawing the shape it
      // always drew.
      for (const layout of ["card", "open", "full-bleed"]) {
        const root = frameOf({ layout }) as HTMLElement;
        expect(root.getAttribute("data-frame")).toBeNull();
        expect(root.getAttribute("data-frame-m")).toBeNull();
        expect(root.getAttribute("data-frame-base")).toBeNull();
        expect(root.getAttribute("data-frame-mobile")).toBeNull();
      }
    });

    it("puts the ratio on a static card as a variable, with the attribute that says it exists", () => {
      const root = frameOf({ layout: "card", frame: { base: "21:9" } }) as HTMLElement;
      // The attribute is what the `min-height` and phone-vs-desktop rules read;
      // CSS cannot ask whether a custom property was set.
      expect(root.getAttribute("data-frame")).toBe("");
      expect(root.getAttribute("data-frame-m")).toBeNull();
      expect(root.style.getPropertyValue("--sfb-hero-frame")).toBe("21 / 9");
    });

    it("keeps a phone-only shape off the desktop variable", () => {
      const root = frameOf({ layout: "open", frame: { mobile: "4:5" } }) as HTMLElement;
      expect(root.getAttribute("data-frame")).toBeNull();
      expect(root.getAttribute("data-frame-m")).toBe("");
      expect(root.style.getPropertyValue("--sfb-hero-frame")).toBe("");
      expect(root.style.getPropertyValue("--sfb-hero-frame-m")).toBe("4 / 5");
    });

    it("leaves every layout untouched when the merchant chose no height", () => {
      for (const layout of ["card", "open", "full-bleed"]) {
        const root = frameOf({ layout }) as HTMLElement;
        expect(root.getAttribute("data-h")).toBeNull();
        expect(root.getAttribute("data-h-m")).toBeNull();
        expect(root.style.getPropertyValue("--sfb-hero-h")).toBe("");
      }
    });

    it("puts a height on the hero as a pixel variable, with its own attribute", () => {
      const root = frameOf({ layout: "card", height: { base: 520 } }) as HTMLElement;
      // The attribute is what the "a height replaces the shape" rules read;
      // CSS cannot ask whether a custom property was set.
      expect(root.getAttribute("data-h")).toBe("");
      expect(root.getAttribute("data-h-m")).toBeNull();
      expect(root.style.getPropertyValue("--sfb-hero-h")).toBe("520px");
    });

    it("keeps a phone-only height off the desktop variable", () => {
      // ⚠ Full-bleed draws through an ISLAND, so its variables arrive as props
      // rather than on a style attribute — a height that stopped at the server
      // wrapper would leave this layout unsized while the other two worked.
      const root = frameOf({ layout: "full-bleed", height: { mobile: 300 } }) as HTMLElement;
      expect(root.getAttribute("data-h")).toBeNull();
      expect(root.getAttribute("data-h-m")).toBe("");
      const vars = JSON.parse(root.getAttribute("data-frame-vars") ?? "{}");
      expect(vars["--sfb-hero-h"]).toBeUndefined();
      expect(vars["--sfb-hero-h-m"]).toBe("300px");
    });

    it("carries a height with no shape at all", () => {
      // ⚠ `heroFrame` used to return undefined without a shape, which would have
      // dropped the height on the floor — the object answers the hero's BOX, and
      // either setting is enough to need it.
      const root = frameOf({ layout: "open", height: { base: 400, mobile: 240 } }) as HTMLElement;
      expect(root.getAttribute("data-frame")).toBeNull();
      expect(root.getAttribute("data-h")).toBe("");
      expect(root.getAttribute("data-h-m")).toBe("");
      expect(root.style.getPropertyValue("--sfb-hero-h")).toBe("400px");
      expect(root.style.getPropertyValue("--sfb-hero-h-m")).toBe("240px");
    });

    it("reaches the rotating hero and both full-bleed islands", () => {
      // Each of these is a separate island; a prop that stops at the server
      // wrapper fixes one hero and silently leaves the others unshaped.
      const rotating = renderPage([
        hero({ layout: "card", frame: { base: "1:1", mobile: "9:16" } }, [
          { id: "s1", settings: { image, title: "One" } },
          { id: "s2", settings: { image, title: "Two" } },
        ]),
      ]);
      const stack = rotating.container.querySelector("[data-island]") as HTMLElement;
      expect(stack.getAttribute("data-island")).toBe("hero-slides");
      expect(stack.getAttribute("data-frame-base")).toBe("true");
      expect(stack.getAttribute("data-frame-mobile")).toBe("true");

      for (const settings of [
        { layout: "full-bleed", frame: { base: "21:9" } },
        { layout: "full-bleed", storeBanner: true, frame: { base: "21:9" } },
      ]) {
        const root = frameOf(settings) as HTMLElement;
        expect(root.getAttribute("data-frame-base")).toBe("true");
        /* Both halves of the shape, and they must describe the SAME one: the
           ratio for the card and open heroes' `aspect-ratio`, and the padding
           percentage for the full-width hero, which cannot use `aspect-ratio`
           because a ceiling would clip its copy (see `ASPECT_RATIO_PADDING`).
           9 / 21 = 42.8571%, so a mismatch here means the two maps have drifted. */
        expect(JSON.parse(root.getAttribute("data-frame-vars") ?? "{}")).toEqual({
          "--sfb-hero-frame": "21 / 9",
          "--sfb-hero-pad": "42.8571%",
        });
      }
    });
  });

  describe("picture placement", () => {
    const rootOf = (settings: Record<string, unknown>, slides = 1) => {
      const { container } = renderPage([
        hero(
          settings,
          Array.from({ length: slides }, (_, i) => ({
            id: `s${i}`,
            settings: { image, title: `Slide ${i}` },
          })),
        ),
      ]);
      return (container.querySelector("[data-island]") ??
        container.querySelector(".sf-herocard, .sf-heroopen")) as HTMLElement;
    };

    it("sets no attribute when the merchant placed nothing", () => {
      // Unplaced heroes keep the placement the stylesheet has always drawn.
      for (const layout of ["card", "open"]) {
        const root = rootOf({ layout });
        expect(root.getAttribute("data-media-side")).toBeNull();
        expect(root.getAttribute("data-mobile-first")).toBeNull();
      }
    });

    it("marks a left picture and leaves a right one to the default", () => {
      expect(rootOf({ layout: "card", imageSide: "left" }).getAttribute("data-media-side")).toBe("left");
      // Right IS the default, so it needs no attribute and gets none — one way
      // to draw one rendering.
      expect(rootOf({ layout: "card", imageSide: "right" }).getAttribute("data-media-side")).toBeNull();
    });

    it("carries the phone order on both static layouts", () => {
      expect(rootOf({ layout: "card", mobileFirst: "text" }).getAttribute("data-mobile-first")).toBe("text");
      expect(rootOf({ layout: "open", mobileFirst: "picture" }).getAttribute("data-mobile-first")).toBe(
        "picture",
      );
    });

    it("reaches the rotating hero too", () => {
      const stack = rootOf({ layout: "card", imageSide: "left", mobileFirst: "text" }, 2);
      expect(stack.getAttribute("data-island")).toBe("hero-slides");
      expect([stack.getAttribute("data-side"), stack.getAttribute("data-first")]).toEqual(["left", "text"]);
    });

    it("never places a full-bleed hero, whose picture is its background", () => {
      const root = rootOf({ layout: "full-bleed", imageSide: "left", mobileFirst: "text" });
      expect(root.getAttribute("data-side")).toBeNull();
      expect(root.getAttribute("data-first")).toBeNull();
    });
  });

  it("sends the phone-text choice to whichever full-bleed hero is drawn", () => {
    // Two islands draw a full-width hero — the plain one and the store-banner
    // one — and the setting has to reach both. Missing the second is the trap
    // §0.4 of the plan names, and the previous plan's §11 logs it happening.
    const copyOf = (settings: Record<string, unknown>) => {
      const { container } = renderPage([
        hero(settings, [{ id: "s1", settings: { image, title: "Eid", subtitle: "Free delivery" } }]),
      ]);
      return container.querySelector("[data-island]")?.getAttribute("data-mobile-copy");
    };
    expect(copyOf({ layout: "full-bleed", mobileCopy: "full" })).toBe("full");
    expect(copyOf({ layout: "full-bleed", storeBanner: true, mobileCopy: "full" })).toBe("full");
    // Unset stays unset all the way down: no attribute, so the stylesheet's
    // `:not(...)` keeps drawing what the shop already showed.
    expect(copyOf({ layout: "full-bleed" })).toBeNull();
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

  describe("drawn in the store's own words", () => {
    const banner = { url: "https://cdn.example.com/banner.jpg", mediumUrl: "https://cdn.example.com/banner-md.jpg" };
    // Real ObjectIds: a `ref` setting that is not one is dropped on read.
    const EID_SALE = "64b000000000000000000001";
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
            campaigns: [{ _id: EID_SALE, name: "Eid sale", type: "percentage", value: 10, scope: "storewide" }] as never,
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

    it("names the offer the merchant picked, and nothing once that offer is not running", () => {
      const sale = [{ id: "b", settings: {} }];
      const picked = renderStore([hero({ ...storeHero, campaignId: EID_SALE }, sale)]);
      expect(picked.container.querySelector(".sf-herocard-badge")?.textContent).toBe("Eid sale · 10% ");
      picked.unmount();
      // `campaigns` holds the running offers only — a picked id missing from it
      // has ended, and must not fall back to one the merchant did not choose.
      const ended = renderStore([hero({ ...storeHero, campaignId: "64b000000000000000000009" }, sale)]);
      expect(ended.container.querySelector(".sf-herocard-badge")).toBeNull();
    });

    it("stamps the badge style on the chip, and leaves it unset for the default", () => {
      const slide = [{ id: "s", settings: { badge: "New in" } }];
      const toned = renderStore([hero({ layout: "open", badgeTone: "sale" }, slide)]);
      const chip = toned.container.querySelector(".sf-hero-badge") as HTMLElement;
      expect(chip.textContent).toBe("New in");
      expect(chip.dataset.tone).toBe("sale");
      // The open hero's chip used to paint itself inline, which no tone could override.
      expect(chip.style.background).toBe("");
      expect(chip.style.color).toBe("");
      toned.unmount();
      const plain = renderStore([hero({ layout: "card" }, slide)]);
      expect(plain.container.querySelector(".sf-hero-badge")?.hasAttribute("data-tone")).toBe(false);
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
