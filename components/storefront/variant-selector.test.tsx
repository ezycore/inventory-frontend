// coding-standard: maintained
/**
 * The chip gating vs. `outOfStockBehavior: "backorder"`.
 *
 * A browser test on the seed store cannot show this: it needs a VARIABLE product
 * whose variants all sit at zero stock while the store still sells it. The bug
 * this locks down shipped invisibly — the backend accepts a backorder line for
 * any variant (`storefront-order-lines.service.ts` resolves the same policy and
 * skips the stock check), and every buy surface computed `canBackorder`, but
 * none of them handed it to the chips. So every option was struck through except
 * whichever one `defaultSelection` landed on, and the shopper could buy exactly
 * one variant of a product the store had marked buyable in full.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { VariantSelector, defaultSelection } from "./variant-selector";
import type { CatalogVariant } from "@/lib/storefront-client";

const variant = (
  label: string,
  attributes: Record<string, string>,
  availableQuantity: number,
  price = 100,
): CatalogVariant =>
  ({ _id: label, label, attributes, price, availableQuantity }) as CatalogVariant;

/** One axis, nothing on hand — the shape a backorder product lives in. */
const soldOutSizes = [
  variant("S", { Size: "S" }, 0),
  variant("M", { Size: "M" }, 0),
  variant("L", { Size: "L" }, 0),
];

const chip = (value: string) =>
  screen.getByRole("button", { name: `Size: ${value}` }) as HTMLButtonElement;

describe("defaultSelection", () => {
  it("prefers a variant with stock", () => {
    const mixed = [variant("S", { Size: "S" }, 0), variant("M", { Size: "M" }, 4)];
    expect(defaultSelection(mixed)).toEqual({ Size: "M" });
  });

  it("falls back to the first variant when nothing is in stock", () => {
    expect(defaultSelection(soldOutSizes)).toEqual({ Size: "S" });
  });

  it("treats every variant as available on a backorder product", () => {
    // Flat pricing, so cheapest and first are the same variant — this asserts
    // only that a backorder product gets a real pick rather than an arbitrary
    // one. The price rules are exercised below.
    expect(defaultSelection(soldOutSizes, true)).toEqual({ Size: "S" });
  });

  it("picks the CHEAPEST in-stock variant, not the first", () => {
    // The card headline follows this pick, so a first-in-list default turns
    // "From ৳300" into ৳350 with no shopper action.
    const priced = [
      variant("L", { Size: "L" }, 2, 350),
      variant("M", { Size: "M" }, 2, 300),
    ];
    expect(defaultSelection(priced)).toEqual({ Size: "M" });
  });

  it("picks the cheapest BUYABLE variant on a backorder product", () => {
    // The merged behaviour, and the one neither half had on its own: the
    // cheapest rule came from upstream but tested stock directly, so on a
    // backorder product — every variant at 0 — it found no candidate at all and
    // fell through to `variants[0]`. That is the cheapest rule failing in
    // exactly the case it was written to prevent: the first variant regardless
    // of price. Sharing `isBuyable` is what makes the price promise hold here.
    const priced = [
      variant("L", { Size: "L" }, 0, 350),
      variant("M", { Size: "M" }, 0, 300),
    ];
    expect(defaultSelection(priced, true)).toEqual({ Size: "M" });
    // Without backorder there is nothing buyable, so the fallback stands.
    expect(defaultSelection(priced)).toEqual({ Size: "L" });
  });

  it("skips a cheaper sold-out variant when the product does not backorder", () => {
    // Cheapness never beats buyability — a default the shopper cannot commit is
    // worse than a higher opening price.
    const priced = [
      variant("S", { Size: "S" }, 0, 200),
      variant("M", { Size: "M" }, 5, 300),
    ];
    expect(defaultSelection(priced)).toEqual({ Size: "M" });
  });
});

describe("VariantSelector", () => {
  it("disables a sold-out option when the product does not backorder", () => {
    render(
      <VariantSelector
        variants={soldOutSizes}
        selection={{ Size: "S" }}
        onSelect={vi.fn()}
      />,
    );
    // The selected chip stays live (a shopper must be able to see what they
    // picked); the others are refused.
    expect(chip("S").disabled).toBe(false);
    expect(chip("M").disabled).toBe(true);
    expect(chip("L").disabled).toBe(true);
  });

  it("keeps every option pickable on a backorder product", () => {
    const onSelect = vi.fn();
    render(
      <VariantSelector
        variants={soldOutSizes}
        selection={{ Size: "S" }}
        onSelect={onSelect}
        canBackorder
      />,
    );
    expect(chip("M").disabled).toBe(false);
    expect(chip("L").disabled).toBe(false);
    chip("L").click();
    expect(onSelect).toHaveBeenCalledWith({ Size: "L" });
  });

  it("keeps a sold-out value pickable across BOTH axes of a backorder product", () => {
    // Multi-axis is where the old rule bit hardest: the second axis was pinned
    // to whatever the first variant happened to carry, so a shopper could not
    // reach any combination but one.
    const variants = [
      variant("Red/S", { Color: "Red", Size: "S" }, 0),
      variant("Red/M", { Color: "Red", Size: "M" }, 0),
      variant("Blue/S", { Color: "Blue", Size: "S" }, 0),
    ];
    render(
      <VariantSelector
        variants={variants}
        selection={{ Color: "Red", Size: "S" }}
        onSelect={vi.fn()}
        canBackorder
      />,
    );
    expect(
      (screen.getByRole("button", { name: "Size: M" }) as HTMLButtonElement).disabled,
    ).toBe(false);
    expect(
      (screen.getByRole("button", { name: "Color: Blue" }) as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it("still refuses a combination NO variant covers, backorder or not", () => {
    // Backorder relaxes stock, never the option grid: "Blue / M" is not a thing
    // the merchant sells, so it must stay unpickable.
    const variants = [
      variant("Red/S", { Color: "Red", Size: "S" }, 0),
      variant("Red/M", { Color: "Red", Size: "M" }, 0),
      variant("Blue/S", { Color: "Blue", Size: "S" }, 0),
    ];
    render(
      <VariantSelector
        variants={variants}
        selection={{ Color: "Blue", Size: "S" }}
        onSelect={vi.fn()}
        canBackorder
      />,
    );
    expect(
      (screen.getByRole("button", { name: "Size: M" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("refuses a variant with no online price even on a backorder product", () => {
    const variants = [
      variant("S", { Size: "S" }, 0),
      { ...variant("M", { Size: "M" }, 0), price: null } as CatalogVariant,
    ];
    render(
      <VariantSelector
        variants={variants}
        selection={{ Size: "S" }}
        onSelect={vi.fn()}
        canBackorder
      />,
    );
    expect(chip("M").disabled).toBe(true);
  });
});
