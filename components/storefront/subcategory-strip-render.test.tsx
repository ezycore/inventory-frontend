import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  SubcategoryStrip,
  subcategoryModes,
} from "@/components/storefront/subcategory-strip";
import type { CatalogCategory } from "@/lib/storefront-client";

const items: CatalogCategory[] = [
  { _id: "art", name: "Art", slug: "art", slugPath: "cushion/art" },
  {
    _id: "car",
    name: "Car & logos",
    slug: "car",
    slugPath: "cushion/car",
    image: { url: "/car.webp", mediumUrl: "/car_md.webp", thumbnailUrl: "/car_th.webp" },
  },
];
const parent = { _id: "cushion", name: "Cushion", slugPath: "cushion" };

const draw = (props: Partial<Parameters<typeof SubcategoryStrip>[0]> = {}) =>
  render(
    <SubcategoryStrip
      base="/shop"
      items={items}
      activeId="car"
      parent={parent}
      allLabel="All Cushion"
      {...props}
    />,
  ).container;

describe("subcategoryModes", () => {
  it("defaults to the scroll row on both screens", () => {
    expect(subcategoryModes(undefined)).toEqual({ phone: "scroll", desktop: "scroll" });
  });

  it("lets the phone fall back to the desktop answer", () => {
    expect(subcategoryModes({ base: "wrap" })).toEqual({ phone: "wrap", desktop: "wrap" });
  });

  it("keeps a phone-only answer off the desktop", () => {
    expect(subcategoryModes({ mobile: "tiles" })).toEqual({ phone: "tiles", desktop: "scroll" });
  });
});

describe("SubcategoryStrip", () => {
  it("carries both screens' answers for the stylesheet", () => {
    const nav = draw({ display: { base: "wrap", mobile: "tiles" } }).querySelector("nav");
    expect(nav?.dataset.sub).toBe("wrap");
    expect(nav?.dataset.subM).toBe("tiles");
  });

  it("marks the current collection", () => {
    const current = draw().querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe("Car & logos");
  });

  it("emits picture slots only when a screen uses tiles", () => {
    expect(draw().querySelector(".sf-subchip-pic")).toBeNull();
    const tiles = draw({ display: { mobile: "tiles" } });
    const pics = tiles.querySelectorAll(".sf-subchip-pic");
    // The "All" chip, Art and Car & logos.
    expect(pics).toHaveLength(3);
    // No picture: the initial stands in so the grid still lines up.
    expect(pics[1].textContent).toBe("A");
    expect(pics[2].querySelector("img")).not.toBeNull();
  });

  it("draws nothing when hidden on both screens", () => {
    expect(draw({ display: { base: "hidden" } }).querySelector("nav")).toBeNull();
    expect(draw({ display: { base: "wrap", mobile: "hidden" } }).querySelector("nav")).not.toBeNull();
  });
});
