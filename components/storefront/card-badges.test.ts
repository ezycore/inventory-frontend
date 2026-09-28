import { describe, expect, it } from "vitest";
import type { ProductTag } from "@/lib/storefront-client";
import { cardBadgeTags, discountBadgeText } from "./card-badges";

const tag = (name: string, extra: Partial<ProductTag> = {}): ProductTag => ({
  _id: name,
  name,
  slug: name.toLowerCase(),
  ...extra,
});

const names = (tags: ProductTag[]) => tags.map((t) => t.name);

describe("cardBadgeTags", () => {
  it("with nothing set, is the first two in attach order — today's card", () => {
    const tags = [tag("Shinchan"), tag("Popular"), tag("Best"), tag("Clearance")];
    expect(names(cardBadgeTags(tags, 2))).toEqual(["Shinchan", "Popular"]);
  });

  it("a set priority beats attach order, lower first", () => {
    const tags = [
      tag("Shinchan"),
      tag("Popular", { cardPriority: 5 }),
      tag("Best"),
      tag("Clearance", { cardPriority: 1 }),
    ];
    expect(names(cardBadgeTags(tags, 2))).toEqual(["Clearance", "Popular"]);
  });

  it("ties keep the product's attach order", () => {
    const tags = [tag("A", { cardPriority: 3 }), tag("B", { cardPriority: 3 }), tag("C", { cardPriority: 3 })];
    expect(names(cardBadgeTags(tags, 2))).toEqual(["A", "B"]);
  });

  it("a tag switched off the card never takes a slot", () => {
    const tags = [tag("Shinchan", { showOnCard: false }), tag("Popular"), tag("Best")];
    expect(names(cardBadgeTags(tags, 2))).toEqual(["Popular", "Best"]);
    // …even with the best priority in the set.
    const ranked = [tag("Shinchan", { showOnCard: false, cardPriority: 1 }), tag("Popular")];
    expect(names(cardBadgeTags(ranked, 2))).toEqual(["Popular"]);
  });

  it("a null priority sorts like an unset one", () => {
    const tags = [tag("A", { cardPriority: null }), tag("B", { cardPriority: 9 })];
    expect(names(cardBadgeTags(tags, 1))).toEqual(["B"]);
  });

  it("max 0 and missing tags give nothing", () => {
    expect(cardBadgeTags([tag("A")], 0)).toEqual([]);
    expect(cardBadgeTags(undefined, 2)).toEqual([]);
  });

  it("does not reorder the caller's array (the product page shares it)", () => {
    const tags = [tag("A"), tag("B", { cardPriority: 1 })];
    cardBadgeTags(tags, 2);
    expect(names(tags)).toEqual(["A", "B"]);
  });
});

describe("discountBadgeText", () => {
  const base = { price: 450, compareAt: 600, currency: "BDT" };

  it("percent is today's badge", () => {
    expect(discountBadgeText({ ...base, mode: "percent" })).toBe("-25%");
  });

  it("amount shows the saving in the store's currency", () => {
    expect(discountBadgeText({ ...base, mode: "amount" })).toBe("-৳150");
  });

  it("off draws no badge", () => {
    expect(discountBadgeText({ ...base, mode: "off" })).toBeNull();
  });

  it("a campaign label replaces either format, but not off", () => {
    expect(discountBadgeText({ ...base, mode: "percent", label: "Eid Sale" })).toBe("Eid Sale");
    expect(discountBadgeText({ ...base, mode: "amount", label: "Eid Sale" })).toBe("Eid Sale");
    expect(discountBadgeText({ ...base, mode: "off", label: "Eid Sale" })).toBeNull();
    expect(discountBadgeText({ ...base, mode: "percent", label: "  " })).toBe("-25%");
  });

  it("no saving, no badge — a label never advertises a sale the card cannot show", () => {
    expect(discountBadgeText({ price: 600, compareAt: 600, mode: "percent", label: "Eid Sale" })).toBeNull();
    expect(discountBadgeText({ price: 600, compareAt: null, mode: "amount" })).toBeNull();
  });
});
