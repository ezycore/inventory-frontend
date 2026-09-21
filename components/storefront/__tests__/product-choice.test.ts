// coding-standard: maintained
import { describe, expect, it } from "vitest";
import type { CatalogProduct, CatalogVariant } from "@/lib/storefront-client";
import { cartLineCap } from "@/lib/storefront-cart-qty";
import { choiceLine, resolveProductChoice } from "../product-choice";

/**
 * One answer to "what did the shopper pick, and what does it cost" for the
 * product page, the quick-buy sheet and a landing page's order form.
 */
const variant = (id: string, size: string, price: number, availableQuantity: number): CatalogVariant =>
  ({ _id: id, label: size, attributes: { Size: size }, price, availableQuantity, images: [] }) as unknown as CatalogVariant;

const product = (over: Partial<CatalogProduct> = {}): CatalogProduct =>
  ({
    _id: "p1",
    slug: "panjabi",
    name: "Panjabi",
    productType: "single",
    price: 1200,
    compareAtPrice: 1500,
    availableQuantity: 4,
    images: [],
    ...over,
  }) as CatalogProduct;

describe("resolveProductChoice", () => {
  it("prices and stocks a single product from itself", () => {
    const item = product();
    const choice = resolveProductChoice(item, {});

    expect(choice).toMatchObject({ variable: false, price: 1200, hasOld: true, availableQty: 4, soldOut: false, incomplete: false });
    expect(choiceLine(item, choice, 2)).toMatchObject({
      productId: "p1",
      variantId: undefined,
      price: 1200,
      quantity: 2,
      maxQty: cartLineCap(4, false),
    });
  });

  it("starts a variable product on its cheapest buyable option, then follows the pick", () => {
    const item = product({
      productType: "variable",
      variants: [variant("v-l", "L", 1400, 3), variant("v-m", "M", 1100, 0), variant("v-s", "S", 1250, 2)],
    });

    const initial = resolveProductChoice(item, {});
    expect(initial.selected?._id).toBe("v-s");
    expect(initial.price).toBe(1250);

    const picked = resolveProductChoice(item, { Size: "L" });
    expect(choiceLine(item, picked, 1)).toMatchObject({ variantId: "v-l", variantLabel: "L", price: 1400 });
  });

  it("keeps a backorder product buyable at zero stock", () => {
    const choice = resolveProductChoice(product({ availableQuantity: 0, outOfStockBehavior: "backorder" }), {});
    expect(choice.soldOut).toBe(false);
  });

  it("sells out a product at zero stock that does not backorder", () => {
    expect(resolveProductChoice(product({ availableQuantity: 0 }), {}).soldOut).toBe(true);
  });

  it("will not order a variable product whose pick matches no variant", () => {
    const item = product({ productType: "variable", variants: [variant("v-s", "S", 1250, 2)] });
    expect(resolveProductChoice(item, { Size: "XXL" }).incomplete).toBe(true);
  });
});
