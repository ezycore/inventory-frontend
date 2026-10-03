// coding-standard: maintained

import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { I18N } from "@/lib/storefront-i18n";
import type { ProductShape } from "./product-page";

/**
 * What the `product-main` section's settings actually do to the product page.
 *
 * ⚠ **A class or a variable asserted here is not a rendering asserted here.**
 * jsdom applies no stylesheet, so everything below says only that the page hands
 * the CSS the hooks it needs — `.sfb-pdp` with its two frame variables, and
 * `.sfb-cols` / `.sfb-cols-m` beside the grid that reads them. Whether the rules
 * in `storefront-builder.css` then WIN is a browser question, and this repo has
 * already shipped one control whose class was right and whose CSS lost to an
 * inline style (the checkout's coupon row, 2026-09-21). Both were checked live.
 *
 * The other half is what must NOT happen: a product page that sets nothing
 * carries no class, no variable and no prop, so every unconfigured page renders
 * exactly as it did.
 */
const related = [
  { _id: "r1", name: "Jamdani", slug: "jamdani" },
  { _id: "r2", name: "Katan", slug: "katan" },
];

let detailArgs: unknown[] = [];

vi.mock("@/components/storefront/product-detail/use-product-detail", () => ({
  useProductDetail: (...args: unknown[]) => {
    detailArgs = args;
    return {
      t: I18N.en,
      base: "/shop",
      product: { _id: "p1", name: "Nakshi kantha", slug: "nakshi-kantha" },
      productSlug: "nakshi-kantha",
      store: { name: "RMC" },
      categories: [],
      currency: "BDT",
      images: [],
      isLoading: false,
      isError: false,
      galleryTop: false,
      related,
    };
  },
}));
vi.mock("@/components/storefront/product-detail/product-overview", () => ({
  ProductOverview: ({ imageFit, showDescription }: { imageFit?: string; showDescription?: boolean }) => (
    <div data-testid="overview" data-fit={String(imageFit)} data-description={String(showDescription)} />
  ),
  ProductLongDescription: () => <div data-testid="long-description" />,
}));
vi.mock("@/components/storefront/product-detail/product-sticky-bar", () => ({
  ProductStickyBar: () => null,
}));
vi.mock("@/components/storefront/breadcrumb", () => ({ Breadcrumb: () => null }));
vi.mock("@/components/storefront/product-card", () => ({
  ProductCard: ({ imageFit, imageRatio }: { imageFit?: string; imageRatio?: string }) => (
    <div data-testid="card" data-fit={String(imageFit)} data-ratio={String(imageRatio)} />
  ),
}));

const { ProductPageView } = await import("./product-page");

const draw = (shape?: ProductShape, hideDescription = false) => {
  const { container } = render(<ProductPageView shape={shape} hideDescription={hideDescription} />);
  const page = container.firstElementChild as HTMLElement;
  return {
    page,
    row: container.querySelector("[data-testid='card']")?.parentElement as HTMLElement,
    overview: container.querySelector("[data-testid='overview']") as HTMLElement,
    longDescription: container.querySelector("[data-testid='long-description']"),
    cards: [...container.querySelectorAll("[data-testid='card']")] as HTMLElement[],
  };
};

beforeEach(() => {
  detailArgs = [];
});

describe("the product page's photo shape", () => {
  it("carries neither the class nor the variables when the merchant set no shape", () => {
    const { page } = draw();
    expect(page.className).toBe("");
    expect(page.style.getPropertyValue("--sfb-pdp-frame")).toBe("");
    expect(page.style.getPropertyValue("--sfb-pdp-frame-m")).toBe("");
  });

  it("writes the desktop shape, and the phone's beside it", () => {
    const { page } = draw({ imageRatio: { base: "3 / 4", mobile: "1 / 1" } });
    expect(page.className).toBe("sfb-pdp");
    expect(page.style.getPropertyValue("--sfb-pdp-frame")).toBe("3 / 4");
    expect(page.style.getPropertyValue("--sfb-pdp-frame-m")).toBe("1 / 1");
  });

  it("leaves the desktop variable unwritten for a phone-only shape", () => {
    // The stylesheet's job from here: an undefined `--sfb-pdp-frame` makes the
    // variable the gallery reads guaranteed-invalid, which is exactly when its
    // `var(…, <the store's shape>)` fallback applies. The desktop keeps the
    // store's shape rather than losing its aspect ratio altogether.
    const { page } = draw({ imageRatio: { mobile: "1 / 1" } });
    expect(page.className).toBe("sfb-pdp");
    expect(page.style.getPropertyValue("--sfb-pdp-frame")).toBe("");
    expect(page.style.getPropertyValue("--sfb-pdp-frame-m")).toBe("1 / 1");
  });

  it("hands the fit down as a prop, because no stylesheet can switch it", () => {
    // `canvas` and `cover` are two different renderings inside `Media` — a
    // blurred backdrop with the whole photo over it, or one cropped photo — so
    // unlike the shape it cannot be a custom property.
    expect(draw().overview.dataset.fit).toBe("undefined");
    expect(draw({ imageFit: "cover" }).overview.dataset.fit).toBe("cover");
  });
});

describe("the product page's related row", () => {
  it("stays the storefront's own grid until a count is set", () => {
    expect(draw().row.className).toBe("sf-grid-4");
  });

  it("keeps the grid class and adds only the screens the merchant answered for", () => {
    // ⚠ The bug this pins: the column class was swapped IN PLACE OF the grid
    // class on the Related products section, and `.sfb-cols` declares no
    // `display: grid` — so answering "3 in a row" drew one card per line.
    expect(draw({ relatedColumns: { base: 3 } }).row.className).toBe("sf-grid-4 sfb-cols");
    expect(draw({ relatedColumns: { mobile: 2 } }).row.className).toBe("sf-grid-4 sfb-cols-m");
    expect(draw({ relatedColumns: { base: 3, mobile: 2 } }).row.className).toBe(
      "sf-grid-4 sfb-cols sfb-cols-m",
    );
  });

  it("writes each screen's count as its own variable", () => {
    const { row } = draw({ relatedColumns: { base: 3, mobile: 2 } });
    expect(row.style.getPropertyValue("--sfb-cols")).toBe("3");
    expect(row.style.getPropertyValue("--sfb-cols-m")).toBe("2");
  });

  it("gives the cards the section's card photo, and nothing when it has none", () => {
    for (const card of draw().cards) {
      expect(card.dataset.fit).toBe("undefined");
      expect(card.dataset.ratio).toBe("undefined");
    }
    for (const card of draw({ cardImageFit: "canvas", cardImageRatio: "3 / 4" }).cards) {
      expect(card.dataset.fit).toBe("canvas");
      expect(card.dataset.ratio).toBe("3 / 4");
    }
  });

  it("carries the card chrome as attributes on the row, never on the page", () => {
    // The attributes redefine `--radius-md` and the `--btn-*` group for their
    // whole subtree. On the page wrapper they would round whatever a merchant
    // adds to the product page next, under a control named for the related row.
    const { row, page } = draw({ cardLook: { cardCorners: "round", cardButtons: "outline" } });
    expect(row.getAttribute("data-card-corners")).toBe("round");
    expect(row.getAttribute("data-card-buttons")).toBe("outline");
    expect(page.hasAttribute("data-card-corners")).toBe(false);
  });

  it("writes no attribute for a section that answered neither", () => {
    const { row } = draw();
    expect(row.hasAttribute("data-card-corners")).toBe(false);
    expect(row.hasAttribute("data-card-buttons")).toBe(false);
  });

  it("asks the query for the merchant's count rather than the built-in four", () => {
    draw({ relatedLimit: 6 });
    expect(detailArgs[2]).toBe(6);
    draw();
    expect(detailArgs[2]).toBeUndefined();
  });
});

describe("the product's own words", () => {
  it("draws the description block, and the short description with it, by default", () => {
    const { longDescription, overview } = draw();
    expect(longDescription).not.toBeNull();
    expect(overview.dataset.description).toBe("true");
  });

  it("takes both off together when the merchant hides them", () => {
    // Two renderings of one description — short in the buy column, long below
    // the purchase block — and hiding one without the other would leave the
    // page showing the words it was told to drop.
    const { longDescription, overview } = draw(undefined, true);
    expect(longDescription).toBeNull();
    expect(overview.dataset.description).toBe("false");
  });
});
