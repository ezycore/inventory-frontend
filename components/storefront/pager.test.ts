import { describe, expect, it } from "vitest";
import { pageItems, type PageItem } from "@/components/storefront/pager";

/**
 * The pager's whole job is staying the same width while the shopper walks a
 * collection, so every case below asserts the slot count as well as the shape —
 * a regression that only widens the strip is exactly the kind that ships.
 */
const SLOTS = 7; // siblings(1) * 2 + 5

const first = (items: PageItem[]) => items[0];
const last = (items: PageItem[]) => items[items.length - 1];

describe("pageItems", () => {
  it("lists every page when they all fit", () => {
    expect(pageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(pageItems(4, SLOTS)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("collapses only the far side near the start", () => {
    expect(pageItems(1, 20)).toEqual([1, 2, 3, 4, 5, "gap", 20]);
    expect(pageItems(3, 20)).toEqual([1, 2, 3, 4, 5, "gap", 20]);
  });

  it("collapses only the near side at the end", () => {
    expect(pageItems(20, 20)).toEqual([1, "gap", 16, 17, 18, 19, 20]);
    expect(pageItems(18, 20)).toEqual([1, "gap", 16, 17, 18, 19, 20]);
  });

  it("collapses both sides in the middle", () => {
    expect(pageItems(10, 20)).toEqual([1, "gap", 9, 10, 11, "gap", 20]);
  });

  it("keeps a constant width, and first/last always reachable", () => {
    for (let page = 1; page <= 20; page++) {
      const items = pageItems(page, 20);
      expect(items).toHaveLength(SLOTS);
      expect(first(items)).toBe(1);
      expect(last(items)).toBe(20);
      expect(items).toContain(page);
    }
  });

  it("clamps a page outside the range instead of emitting nonsense", () => {
    expect(pageItems(0, 20)).toEqual(pageItems(1, 20));
    expect(pageItems(99, 20)).toEqual(pageItems(20, 20));
  });

  it("honours a wider sibling window", () => {
    expect(pageItems(10, 20, 2)).toEqual([1, "gap", 8, 9, 10, 11, 12, "gap", 20]);
  });
});
