// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { trimToWholeRows } from "@/components/storefront/home/home-shared";

describe("trimToWholeRows — QA-124 (featured grid must not leave a ragged last row)", () => {
  it("drops the orphans: 6 items in a 4-wide grid becomes one full row of 4", () => {
    expect(trimToWholeRows([1, 2, 3, 4, 5, 6])).toEqual([1, 2, 3, 4]);
  });

  it("leaves an already-whole count untouched", () => {
    expect(trimToWholeRows([1, 2, 3, 4, 5, 6, 7, 8])).toHaveLength(8);
  });

  it("leaves a small catalogue's single short row alone — that's not the ragged shape", () => {
    expect(trimToWholeRows([1, 2, 3])).toEqual([1, 2, 3]);
    expect(trimToWholeRows([])).toEqual([]);
  });

  it("9 items (2 full rows + 1 orphan) drops to 8", () => {
    expect(trimToWholeRows([1, 2, 3, 4, 5, 6, 7, 8, 9])).toHaveLength(8);
  });
});
