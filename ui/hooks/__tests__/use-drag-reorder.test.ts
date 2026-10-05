import { describe, expect, it } from "vitest";
import { dropIndex } from "../use-drag-reorder";

// Four rows 40px tall: centres at 20, 60, 100, 140.
const CENTRES = [20, 60, 100, 140];

describe("dropIndex", () => {
  it("stays put until the dragged row's centre passes a neighbour's", () => {
    expect(dropIndex(CENTRES, 1, 60)).toBe(1);
    expect(dropIndex(CENTRES, 1, 99)).toBe(1);
  });

  it("moves down past each centre it crosses", () => {
    expect(dropIndex(CENTRES, 1, 101)).toBe(2);
    expect(dropIndex(CENTRES, 1, 141)).toBe(3);
    expect(dropIndex(CENTRES, 0, 500)).toBe(3);
  });

  it("moves up past each centre it crosses", () => {
    expect(dropIndex(CENTRES, 3, 59)).toBe(1);
    expect(dropIndex(CENTRES, 3, -100)).toBe(0);
  });
});
