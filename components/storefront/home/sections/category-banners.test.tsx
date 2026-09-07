// coding-standard: maintained
/**
 * `category-banners` — which collections it advertises, in what order, and what
 * it does when a pick has gone.
 *
 * The rules pinned here are the ones a reader cannot recover from the markup:
 * the merchant's ORDER is the block's order (a promo block is a merchandising
 * decision and which department leads it is the decision), an unpicked block
 * shows the first two rather than nothing (a section that renders blank looks
 * broken in the preview the merchant is staring at), and a collection that no
 * longer resolves is skipped without taking the rest of the block with it.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CategoryBanners } from "@/components/storefront/home/sections/category-banners";
import type { CatalogCategory } from "@/lib/storefront-client";
import { I18N } from "@/lib/storefront-i18n";
import { useSfPreview } from "@/services/stores/use-sf-preview-store";

const category = (
  id: string,
  name: string,
  extra: Partial<CatalogCategory> = {},
): CatalogCategory => ({
  _id: id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  slugPath: name.toLowerCase().replace(/\s+/g, "-"),
  ...extra,
});

const CATEGORIES = [
  category("a", "Skin care", { description: "Cleansers and serums" }),
  category("b", "Devices"),
  category("c", "Gifting", {
    children: [category("c1", "Hampers")],
  }),
];

/* The section reads the shop's image-fit setting through a query hook, so it
   needs a client even though nothing here resolves. */
const withClient = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {ui}
    </QueryClientProvider>,
  );

/** Only the props `CategoryBanners` reads; the rest of `SectionProps` is unused. */
const renderBanners = (
  config?: {
    key: string;
    categoryIds?: string[];
    cardShape?: "stacked" | "split";
    cardSide?: "left" | "right" | "alternate";
    cardSplit?: number;
    cardHideText?: boolean;
    mobile?: {
      cardShape?: "stacked" | "split";
      cardSide?: "left" | "right" | "alternate";
      cardSplit?: number;
      cardHideText?: boolean;
      cardHeight?: number;
      cardFlow?: "wrap" | "scroll";
      cardPerRow?: number;
    };
    cardRatio?: "16:9" | "4:3" | "1:1" | "3:4";
    cardHeight?: number;
    cardFlow?: "wrap" | "scroll";
    cardPerRow?: number;
    cardRadius?: number;
    cardArrows?: boolean;
    fullWidth?: boolean;
    showCta?: boolean;
    cards?: {
      categoryId: string;
      title?: string;
      description?: string;
      image?: { url?: string } | null;
      buttonLabel?: string;
      buttonHref?: string;
    }[];
  },
  categories: CatalogCategory[] = CATEGORIES,
) =>
  withClient(
    <CategoryBanners
      base=""
      featured={[]}
      latest={[]}
      categories={categories}
      campaigns={[]}
      t={I18N.en}
      store={{ name: "Shop" } as never}
      config={config}
    />,
  );

const cardNames = () =>
  screen.getAllByRole("link").map((a) => a.textContent?.split("Shop now")[0]?.trim());

describe("CategoryBanners", () => {
  it("shows the first two collections before the merchant picks any", () => {
    renderBanners();
    expect(cardNames()).toEqual(["Skin careCleansers and serums", "Devices"]);
  });

  it("renders the merchant's picks in the merchant's order", () => {
    renderBanners({ key: "k", categoryIds: ["b", "a"] });
    expect(cardNames()).toEqual(["Devices", "Skin careCleansers and serums"]);
  });

  // The tree is two levels deep and a sub-collection is a legitimate thing to
  // advertise — a flat `categories.find` would silently drop it.
  it("resolves a sub-collection", () => {
    renderBanners({ key: "k", categoryIds: ["c1"] });
    expect(cardNames()).toEqual(["Hampers"]);
  });

  // Skipped, never pruned: a collection hidden for a week must come back when
  // it returns, and the rest of the block must not vanish with it meanwhile.
  it("skips a pick that no longer resolves and keeps the rest", () => {
    renderBanners({ key: "k", categoryIds: ["gone", "b"] });
    expect(cardNames()).toEqual(["Devices"]);
  });

  it("renders nothing at all when the shop has no collections", () => {
    const { container } = renderBanners(undefined, []);
    expect(container).toBeEmptyDOMElement();
  });

  // Four is the API's cap. Honoured on READ as well, so a document written
  // before the cap — or by something other than the editor — cannot render a
  // fifth card that wraps onto a row of its own.
  it("draws at most four cards", () => {
    renderBanners({ key: "k", categoryIds: ["a", "b", "c", "c1", "a"] });
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });

  it("links each card at its own collection", () => {
    renderBanners({ key: "k", categoryIds: ["b"] });
    expect(screen.getByRole("link")).toHaveAttribute("href", "/devices");
  });

  /* ---- `cardShape` ----
     The class is the whole contract between this component and the stylesheet,
     and it is the only half of the feature testable here: whether `split`
     actually puts the photograph beside the copy is decided by a `min-width`
     rule, and jsdom applies no stylesheet. So these pin what the component
     promises, and the phone half is verified in a browser (see the QA doc). */

  it("draws the stacked card when the merchant has never chosen", () => {
    renderBanners({ key: "k", categoryIds: ["b"] });
    expect(screen.getByRole("link").className).not.toContain("sf-banner-card--split");
  });

  it("draws the split card when the merchant chose it", () => {
    renderBanners({ key: "k", categoryIds: ["b"], cardShape: "split" });
    expect(screen.getByRole("link").className).toContain("sf-banner-card--split");
  });

  // Only an explicit `split` moves the picture. A stored `"stacked"` — which
  // the editor never writes, but an older document or a direct API call might —
  // must land on the same card as unset, not on some third thing.
  /* The row's HEIGHT, and the reason the block looked half-empty on a shop that
     had written nothing. A split card takes its height from the photograph's
     aspect box, so a name-and-button card was stretched by the picture beside
     it; with no description anywhere in the row the class drops the box to a
     ratio the copy can beat. Asked once for the ROW — one card with a sentence
     keeps every card the same shape, which is the same rule the tile section
     follows for `photographed`. */
  it("marks a row where no card has a description", () => {
    renderBanners({ key: "k", categoryIds: ["b"], cardShape: "split" });
    expect(document.querySelector(".sf-banner-row")?.className).toContain(
      "sf-banner-row--terse",
    );
  });

  it("leaves the row alone when any card has a description", () => {
    renderBanners({ key: "k", categoryIds: ["a", "b"], cardShape: "split" });
    expect(document.querySelector(".sf-banner-row")?.className).not.toContain(
      "sf-banner-row--terse",
    );
  });

  it("treats a stored stacked value as the default card", () => {
    renderBanners({ key: "k", categoryIds: ["b"], cardShape: "stacked" });
    expect(screen.getByRole("link").className).not.toContain("sf-banner-card--split");
  });

  // The shape is a look, not a pick: a merchant may choose it before curating,
  // and the block still has to render its fallback collections.
  it("applies the shape to an unpicked block", () => {
    renderBanners({ key: "k", cardShape: "split" });
    const cards = screen.getAllByRole("link");
    expect(cards).toHaveLength(2);
    cards.forEach((card) =>
      expect(card.className).toContain("sf-banner-card--split"),
    );
  });

  /* ⚠ **Overrides, never edits.** This is the requirement the feature exists
     for: a merchant writing card copy is advertising in ONE block, and the
     collection keeps its own name and description for its page and every other
     row that lists it. An earlier cut wrote `category.description`, so styling
     the home page rewrote the collection page — nothing in a type check or a
     render test caught that, which is why these assert the fallback as hard as
     they assert the override. */
  describe("per-card overrides", () => {
    it("prints the card's own title and description over the collection's", () => {
      renderBanners({
        key: "k",
        categoryIds: ["a"],
        cards: [
          { categoryId: "a", title: "Winter skin", description: "Half price" },
        ],
      });
      expect(cardNames()).toEqual(["Winter skinHalf price"]);
    });

    it("falls back to the collection when a field is blank", () => {
      renderBanners({
        key: "k",
        categoryIds: ["a"],
        // A title only: the description must still come from the collection.
        cards: [{ categoryId: "a", title: "Winter skin" }],
      });
      expect(cardNames()).toEqual(["Winter skinCleansers and serums"]);
    });

    it("leaves a card with no overrides exactly as it was", () => {
      renderBanners({
        key: "k",
        categoryIds: ["a", "b"],
        cards: [{ categoryId: "b", title: "Gadgets" }],
      });
      expect(cardNames()).toEqual(["Skin careCleansers and serums", "Gadgets"]);
    });

    it("uses the card's own button label", () => {
      renderBanners({
        key: "k",
        categoryIds: ["b"],
        cards: [{ categoryId: "b", buttonLabel: "See the range" }],
      });
      expect(screen.getByText("See the range")).toBeInTheDocument();
    });

    // The whole card is the anchor, so an override moves the card, not just a
    // nested button that does not exist.
    it("points the card at the merchant's own link", () => {
      renderBanners({
        key: "k",
        categoryIds: ["b"],
        cards: [{ categoryId: "b", buttonHref: "/products?tags=winter" }],
      });
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "/products?tags=winter",
      );
    });

    it("keeps the collection page as the link when none is written", () => {
      renderBanners({ key: "k", categoryIds: ["b"] });
      expect(screen.getByRole("link")).toHaveAttribute("href", "/devices");
    });

    /* The row shortens itself only when nothing will PRINT a sentence. Card
       copy counts: shortening a card whose description the merchant just typed
       would undo the thing they did. */
    it("is not a terse row when a card carries its own description", () => {
      renderBanners({
        key: "k",
        categoryIds: ["b"],
        cardShape: "split",
        cards: [{ categoryId: "b", description: "Kettles and blenders" }],
      });
      expect(document.querySelector(".sf-banner-row")?.className).not.toContain(
        "sf-banner-row--terse",
      );
    });
  });

  describe("row-level composition", () => {
    // Alternating needs a side to alternate; a stacked card has none.
    /* **The swap, which is what the control was actually asked for.** It
       shipped as a boolean that only ever produced the zebra, so a merchant who
       wanted the picture on the right of every card had no way to say so. Both
       are values of one setting now. `-d` because the desktop and the phone
       each get their own class — one HTML document serves both screens. */
    it("puts the picture on the far side of every card", () => {
      renderBanners({
        key: "k",
        categoryIds: ["a", "b"],
        cardShape: "split",
        cardSide: "right",
      });
      const row = document.querySelector(".sf-banner-row")?.className ?? "";
      expect(row).toContain("sf-banner-row--right-d");
      expect(row).not.toContain("sf-banner-row--alternate-d");
    });

    it("alternates sides only under the split card", () => {
      renderBanners({
        key: "k",
        categoryIds: ["a", "b"],
        cardShape: "split",
        cardSide: "alternate",
      });
      expect(document.querySelector(".sf-banner-row")?.className).toContain(
        "sf-banner-row--alternate-d",
      );
    });

    it("ignores a side on a stacked row", () => {
      renderBanners({ key: "k", categoryIds: ["a", "b"], cardSide: "alternate" });
      expect(document.querySelector(".sf-banner-row")?.className).not.toContain(
        "sf-banner-row--alternate",
      );
    });

    /* A chosen shape is written INLINE, which is the one place this file may do
       that: an inline value outranks every media query, and that is precisely
       what "use this shape on every screen" has to mean. Unset must stay unset
       so the stylesheet keeps deciding per composition and per breakpoint. */
    it("writes a chosen picture shape onto the card", () => {
      renderBanners({ key: "k", categoryIds: ["b"], cardRatio: "1:1" });
      expect(screen.getByRole("link").getAttribute("style")).toContain(
        "--sf-bc-ratio-set: 1 / 1",
      );
    });

    it("writes no shape when the merchant has not chosen one", () => {
      renderBanners({ key: "k", categoryIds: ["b"] });
      expect(screen.getByRole("link").getAttribute("style")).not.toContain(
        "--sf-bc-ratio",
      );
    });
  });
});

/**
 * The four settings that were asked for after the first cut shipped, and the
 * one seam they all share: **this page is rendered without a viewport.**
 *
 * A storefront is server-rendered, so the component cannot branch on screen
 * size. It emits every answer for both screens — `-d` and `-m` classes, and a
 * `--sf-bc-split-d` / `--sf-bc-split-m` pair — and the stylesheet's breakpoint
 * reads the half it wants. That is the thing worth pinning here: not that a
 * class exists, but that BOTH exist and that they can disagree.
 */
describe("CategoryBanners — per-device composition", () => {
  const row = () => document.querySelector(".sf-banner-row")?.className ?? "";
  const card = () =>
    document.querySelector(".sf-banner-card") as HTMLElement | null;

  it("gives a phone the desktop composition until it is told otherwise", () => {
    renderBanners({ key: "k", categoryIds: ["a", "b"], cardShape: "split" });
    const cls = card()?.className ?? "";
    expect(cls).toContain("sf-banner-card--split-d");
    expect(cls).toContain("sf-banner-card--split-m");
  });

  /* ⚠ The whole point of the phone block. A merchant whose desktop cards are
     two even columns can have the SAME row stack on a phone, where an even
     split is ~170px a column and carries neither the picture nor the sentence.
     One document, two answers. */
  it("lets a phone stack a row the desktop splits", () => {
    renderBanners({
      key: "k",
      categoryIds: ["a", "b"],
      cardShape: "split",
      mobile: { cardShape: "stacked" },
    });
    const cls = card()?.className ?? "";
    expect(cls).toContain("sf-banner-card--split-d");
    expect(cls).not.toContain("sf-banner-card--split-m");
  });

  it("writes each screen's picture width into its own slot", () => {
    renderBanners({
      key: "k",
      categoryIds: ["a", "b"],
      cardShape: "split",
      cardSplit: 65,
      mobile: { cardShape: "split", cardSplit: 30 },
    });
    const style = card()?.getAttribute("style") ?? "";
    expect(style).toContain("--sf-bc-split-d: 65%");
    expect(style).toContain("--sf-bc-split-m: 30%");
  });

  it("carries one width to both screens when the phone has no answer", () => {
    renderBanners({
      key: "k",
      categoryIds: ["a", "b"],
      cardShape: "split",
      cardSplit: 65,
    });
    const style = card()?.getAttribute("style") ?? "";
    expect(style).toContain("--sf-bc-split-d: 65%");
    expect(style).toContain("--sf-bc-split-m: 65%");
  });

  it("swaps the picture to the far side on every card, not every second one", () => {
    renderBanners({
      key: "k",
      categoryIds: ["a", "b"],
      cardShape: "split",
      cardSide: "right",
    });
    expect(row()).toContain("sf-banner-row--right-d");
    expect(row()).not.toContain("alternate");
  });

  it("lets the two screens disagree about the picture side", () => {
    renderBanners({
      key: "k",
      categoryIds: ["a", "b"],
      cardShape: "split",
      cardSide: "right",
      mobile: { cardSide: "left" },
    });
    expect(row()).toContain("sf-banner-row--right-d");
    expect(row()).not.toContain("sf-banner-row--right-m");
  });
});

/**
 * Words off — the picture takes the whole card.
 *
 * The interesting half is the accessibility one. A card with no visible text
 * has nothing to take an accessible name from, so the name moves onto the link
 * itself; but a card whose words are hidden on the PHONE ONLY still has a
 * heading in the document, and labelling the link as well would have a desktop
 * screen reader announce the collection twice.
 */
describe("CategoryBanners — words off", () => {
  it("drops the copy and names the link instead", () => {
    renderBanners({ key: "k", categoryIds: ["a"], cardHideText: true, mobile: { cardHideText: true } });
    expect(document.querySelector(".sf-banner-body")).toBeNull();
    expect(screen.getByRole("link")).toHaveAttribute("aria-label", "Skin care");
  });

  it("keeps the copy in the document when only one screen hides it", () => {
    renderBanners({
      key: "k",
      categoryIds: ["a"],
      mobile: { cardHideText: true },
    });
    // The stylesheet hides it at the phone breakpoint; the markup keeps it,
    // because one document serves both screens.
    expect(document.querySelector(".sf-banner-body")).not.toBeNull();
    expect(document.querySelector(".sf-banner-card")?.className).toContain(
      "sf-banner-card--notext-m",
    );
    // …and the link is NOT double-named, since the heading is still readable.
    expect(screen.getByRole("link")).not.toHaveAttribute("aria-label");
  });
});

/**
 * The button, and the rule that makes switching it off safe.
 *
 * The whole card has always been the anchor — the button was only ever its
 * visible half — so a picture-only card loses nothing but the pill.
 */
describe("CategoryBanners — the button", () => {
  it("still links the whole card with the button switched off", () => {
    renderBanners({ key: "k", categoryIds: ["a"], showCta: false });
    expect(screen.queryByText("Shop now")).toBeNull();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/skin-care");
  });
});

/**
 * ⚠ **The merchant's own link, resolved the way every other one in the
 * storefront is.** This rendered through `storeHref`, which only concatenates —
 * so a full address became `/shop/https://…`, a path copied from the merchant's
 * own address bar became `/shop/shop/products`, and on a custom domain (base
 * `""`) a protocol-relative value walked the shopper clean off the shop.
 * `storeLinkHref` is the helper the hero slides, the announcement bar and the
 * product rows all already use.
 */
describe("CategoryBanners — where a card's own link goes", () => {
  const hrefFor = (buttonHref: string, base = "") => {
    renderBanners({
      key: "k",
      categoryIds: ["a"],
      cards: [{ categoryId: "a", buttonHref }],
    });
    void base;
    return screen.getByRole("link").getAttribute("href");
  };

  it("passes a full address through instead of nesting it under the store", () => {
    expect(hrefFor("https://facebook.com/mypage")).toBe(
      "https://facebook.com/mypage",
    );
  });

  it("refuses a scheme it does not know rather than emitting it", () => {
    expect(hrefFor("javascript:alert(1)")).toBe("/products");
  });

  it("refuses a protocol-relative host, which would leave the shop", () => {
    expect(hrefFor("//evil.example")).toBe("/products");
  });

  it("still uses the collection page when the merchant typed nothing", () => {
    renderBanners({ key: "k", categoryIds: ["a"] });
    expect(screen.getByRole("link")).toHaveAttribute("href", "/skin-care");
  });
});

/**
 * An explicit picture height.
 *
 * ⚠ It has to REPLACE the aspect box, not join it. With both a height and an
 * `aspect-ratio`, the box computes a WIDTH from the height and the picture
 * shrinks to a column instead of running the card's width — so the component
 * emits `--sf-bc-ratio: auto` alongside the height.
 */
describe("CategoryBanners — card height", () => {
  const card = () => document.querySelector(".sf-banner-card") as HTMLElement;

  /* The height fills its screen's SLOT and the card wears a `--fixedh-*` class;
     the stylesheet is what stands the aspect box down, per breakpoint. Doing it
     inline could not work now that the two screens can disagree — one document
     has to carry both answers. */
  it("fills both screens' height slots and flags both", () => {
    renderBanners({ key: "k", categoryIds: ["a"], cardHeight: 20, cardRatio: "1:1" });
    const style = card().getAttribute("style") ?? "";
    expect(style).toContain("--sf-bc-h-d: 20px");
    expect(style).toContain("--sf-bc-h-m: 20px");
    expect(card().className).toContain("sf-banner-card--fixedh-d");
    expect(card().className).toContain("sf-banner-card--fixedh-m");
    // The shape is still offered in its slot — the stylesheet, not this
    // component, decides that the height outranks it.
    expect(style).toContain("--sf-bc-ratio-set: 1 / 1");
  });

  /* ⚠ The reason height moved per-screen: 200px is a thin band across a desktop
     and a third of a phone, so one number was doing two different jobs. */
  it("lets the two screens disagree about the height", () => {
    renderBanners({
      key: "k",
      categoryIds: ["a"],
      cardHeight: 200,
      mobile: { cardHeight: 60 },
    });
    const style = card().getAttribute("style") ?? "";
    expect(style).toContain("--sf-bc-h-d: 200px");
    expect(style).toContain("--sf-bc-h-m: 60px");
  });

  it("leaves the shape in charge when no height is set", () => {
    renderBanners({ key: "k", categoryIds: ["a"], cardRatio: "1:1" });
    const style = card().getAttribute("style") ?? "";
    expect(style).toContain("--sf-bc-ratio-set: 1 / 1");
    expect(style).not.toContain("--sf-bc-h");
    expect(card().className).not.toContain("fixedh");
  });
});

/**
 * Row style — a grid, or a track the shopper swipes.
 *
 * ⚠ **The scroll container is mounted when EITHER screen asks for one.** A
 * single DOM node serves both breakpoints, so "a track on a phone, a grid on a
 * desktop" cannot be a choice of element: `CategoryStrip` supplies the track and
 * the arrows, and each breakpoint then keeps it or turns it back into a grid.
 * When neither screen scrolls, none of that machinery is mounted at all — which
 * is the half worth pinning, because it is invisible.
 */
describe("CategoryBanners — row style", () => {
  const row = () => document.querySelector(".sf-banner-row") as HTMLElement;

  it("mounts no scroller for a plain grid row", () => {
    renderBanners({ key: "k", categoryIds: ["a", "b"] });
    expect(document.querySelector(".sf-cat-strip")).toBeNull();
    expect(row().className).toContain("sf-banner-row--wrap-d");
    expect(row().className).toContain("sf-banner-row--wrap-m");
  });

  it("mounts the scroller when only the phone asks for one", () => {
    renderBanners({
      key: "k",
      categoryIds: ["a", "b"],
      mobile: { cardFlow: "scroll" },
    });
    expect(document.querySelector(".sf-cat-strip")).not.toBeNull();
    // …and the desktop still says "grid" for its own breakpoint.
    expect(row().className).toContain("sf-banner-row--wrap-d");
    expect(row().className).toContain("sf-banner-row--track-m");
  });

  it("carries each screen's card count in its own slot", () => {
    renderBanners({
      key: "k",
      categoryIds: ["a", "b"],
      cardPerRow: 4,
      mobile: { cardPerRow: 2 },
    });
    const style = row().getAttribute("style") ?? "";
    expect(style).toContain("--sf-bc-per-d: 4");
    expect(style).toContain("--sf-bc-per-m: 2");
    expect(row().className).toContain("sf-banner-row--cols-d");
    expect(row().className).toContain("sf-banner-row--cols-m");
  });

  it("leaves each screen's own rule alone when no count is set", () => {
    renderBanners({ key: "k", categoryIds: ["a", "b"] });
    expect(row().className).not.toContain("cols-");
  });
});

/**
 * Corners — the shop's, unless this row says otherwise.
 *
 * Corners are a BRAND decision made once in Design → Corners, so an untouched
 * row has to keep reading the theme token rather than a number baked in here.
 */
describe("CategoryBanners — corners", () => {
  const card = () => document.querySelector(".sf-banner-card") as HTMLElement;

  it("follows the shop's own corner setting by default", () => {
    renderBanners({ key: "k", categoryIds: ["a"] });
    expect(card().getAttribute("style")).toContain("var(--radius-lg)");
  });

  it("takes the row's own radius when the merchant sets one", () => {
    renderBanners({ key: "k", categoryIds: ["a"], cardRadius: 0 });
    const style = card().getAttribute("style") ?? "";
    expect(style).toContain("border-radius: 0px");
    expect(style).not.toContain("var(--radius-lg)");
  });
});

/**
 * **The picture's class — the seam between this component and the stylesheet,
 * and the one that broke.**
 *
 * `Picture side` shipped doing nothing: the card's column widths mirrored
 * correctly and the photograph stayed on the left. The rules moved the picture
 * with `order` on `.sf-banner-card--split-d > :first-child`, and the card's
 * first child is `Media`'s `<picture style="display: contents">` — a wrapper
 * that generates NO BOX. `order` is meaningless on such an element and is not
 * inherited by the `<img>` inside it, so the declaration was inert while every
 * neighbouring rule worked, which is exactly why it read as "the setting does
 * nothing" rather than as a layout bug.
 *
 * None of that is visible to a test that renders markup — jsdom computes no
 * layout and would have passed the broken build — so what is pinned here is the
 * CONTRACT the stylesheet relies on: the class lands on the element that really
 * generates the box, and the rules select by that class rather than by
 * position.
 */
describe("CategoryBanners — the stylesheet's handle on the picture", () => {
  const media = () => document.querySelector(".sf-banner-media");

  /* Both photo branches, because they produce DIFFERENT elements and only one
     of them was ever eyeballed: `cover` renders the `<img>` inside the
     `display: contents` picture, `canvas` renders a wrapping `<div>`. The
     canvas wrapper is a real box, so the old positional rules happened to work
     there — the shops that saw `Picture side` do nothing were the ones on
     `cover`. */
  for (const [imageFit, fit] of [
    ["crop", "cover"],
    ["fit", "canvas"],
  ] as const) {
    it(`marks a box that really exists — ${fit} photographs`, () => {
      useSfPreview.setState({ imageFit });
      renderBanners({
        key: "k",
        categoryIds: ["a"],
        cards: [{ categoryId: "a", image: { url: "https://cdn.example/a.jpg" } }],
      });
      const el = media();
      expect(el).not.toBeNull();
      // The whole bug in one assertion: an element with `display: contents`
      // generates no box, so `order` and `align-self` on it do nothing and the
      // `<img>` inside never hears about either.
      expect(getComputedStyle(el as Element).display).not.toBe("contents");
      expect(el?.tagName).not.toBe("PICTURE");
    });
  }

  it("marks the empty box for an unphotographed collection too", () => {
    // It still occupies the picture's column, so it has to obey the same side
    // and width as a card that has a photograph.
    renderBanners({ key: "k", categoryIds: ["b"] });
    expect(media()).not.toBeNull();
  });

  it("never lets a promo-card rule select the picture by position again", () => {
    // Read against the real stylesheet, because this is a bug no rendered
    // markup can show: `> :first-child` matches a wrapper, and the failure is
    // silent everywhere except in front of the merchant.
    const css = readFileSync(
      resolve(process.cwd(), "app/(storefront)/storefront.css"),
      "utf8",
    );
    const positional = css
      // Comments stripped first — the note explaining this bug names the very
      // selector it forbids, and a guard that its own rationale trips is a
      // guard someone deletes.
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .filter((line) => line.includes("sf-banner") && line.includes(":first-child"));
    expect(positional).toEqual([]);
  });
});
