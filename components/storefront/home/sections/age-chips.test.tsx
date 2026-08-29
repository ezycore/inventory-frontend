// coding-standard: maintained
/**
 * `age-chips` — which tags it shows, and in what order.
 *
 * Two things are pinned here, and the second is the reason the section was
 * rewritten: **configured tag ids beat name matching**, so a merchant who
 * renames `0-3M` to `0-3 Months`, translates their tags to Bangla, or adds a
 * band we never heard of keeps their row. Matching names was the original
 * mechanism and it failed all three silently — no error, the chips just
 * quietly stopped appearing.
 *
 * The `AGE_BANDS` literal is the mirror of `AGE_BAND_NAMES` in the backend's
 * `seed-data.ts`; that repo has the same assertion. Change both or neither.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AGE_BANDS,
  AgeChips,
} from "@/components/storefront/home/sections/category-sections";
import type { StoreTag } from "@/lib/storefront-client";
import { I18N } from "@/lib/storefront-i18n";

const tag = (id: string, name: string): StoreTag => ({
  _id: id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  productCount: 3,
});

/** Only the props `AgeChips` actually reads; the rest of `SectionProps` is unused. */
const renderChips = (props: {
  tags?: StoreTag[];
  config?: { key: string; tagIds?: string[] };
}) =>
  render(
    <AgeChips
      base=""
      featured={[]}
      latest={[]}
      categories={[]}
      campaigns={[]}
      t={I18N.en}
      store={{ name: "Little Steps" } as never}
      {...props}
    />,
  );

const chipTexts = () =>
  screen.getAllByRole("link").map((a) => a.textContent?.trim());

describe("AgeChips", () => {
  it("mirrors the backend's AGE_BAND_NAMES, in growth order", () => {
    expect([...AGE_BANDS]).toEqual([
      "Newborn",
      "0-3M",
      "3-6M",
      "6-12M",
      "12-18M",
      "18-24M",
      "2-3Y",
      "3-4Y",
    ]);
  });

  it("falls back to matching names when nothing is configured", () => {
    renderChips({
      tags: [tag("a", "6-12M"), tag("b", "Newborn"), tag("c", "Imported")],
    });
    // Ladder order, not the order the tags arrived in — and the non-age tag is
    // not an age band, so it is left out.
    expect(chipTexts()).toEqual(["Newborn", "6-12M"]);
  });

  it("renders configured tags by id, in the merchant's order", () => {
    renderChips({
      tags: [tag("a", "Newborn"), tag("b", "6-12M"), tag("c", "0-3M")],
      config: { key: "age-chips-0", tagIds: ["b", "c", "a"] },
    });
    expect(chipTexts()).toEqual(["6-12M", "0-3M", "Newborn"]);
  });

  it("keeps renamed and translated tags — the bug this replaced", () => {
    renderChips({
      tags: [tag("a", "0-3 Months"), tag("b", "৬-১২ মাস"), tag("c", "4-5Y")],
      config: { key: "age-chips-0", tagIds: ["a", "b", "c"] },
    });
    // None of these match AGE_BANDS; under name matching the row rendered
    // nothing at all.
    expect(chipTexts()).toEqual(["0-3 Months", "৬-১২ মাস", "4-5Y"]);
  });

  it("drops a configured tag the store no longer has", () => {
    renderChips({
      tags: [tag("a", "Newborn")],
      config: { key: "age-chips-0", tagIds: ["a", "deleted"] },
    });
    expect(chipTexts()).toEqual(["Newborn"]);
  });

  it("renders nothing when no tag resolves", () => {
    const { container } = renderChips({ tags: [tag("c", "Imported")] });
    expect(container).toBeEmptyDOMElement();
  });
});
