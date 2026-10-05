// coding-standard: maintained
import { describe, expect, it } from "vitest";
import type { ProductOrderRow } from "@/services/api";
import {
  isDirty,
  matchesSearch,
  movePlaced,
  movePlacedToPosition,
  place,
  placeAll,
  placedIds,
  unplace,
  type ArrangeState,
} from "../arrange-state";

const row = (id: string, name = id.toUpperCase()): ProductOrderRow => ({
  _id: id,
  name,
  imageUrl: null,
  price: null,
  featured: false,
  purchasable: true,
});

const state = (placed: string[], unplaced: string[] = []): ArrangeState => ({
  placed: placed.map((id) => row(id)),
  unplaced: unplaced.map((id) => row(id)),
});

const ids = (s: ArrangeState) => ({
  placed: s.placed.map((r) => r._id),
  unplaced: s.unplaced.map((r) => r._id),
});

describe("arrange state", () => {
  it("moves a placed product with splice semantics", () => {
    expect(ids(movePlaced(state(["a", "b", "c", "d"]), 0, 2)).placed).toEqual(["b", "c", "a", "d"]);
    expect(ids(movePlaced(state(["a", "b", "c"]), 2, 0)).placed).toEqual(["c", "a", "b"]);
  });

  it("moves to a typed position, clamped to the list", () => {
    expect(ids(movePlacedToPosition(state(["a", "b", "c"]), 2, 1)).placed).toEqual(["c", "a", "b"]);
    expect(ids(movePlacedToPosition(state(["a", "b", "c"]), 0, 99)).placed).toEqual(["b", "c", "a"]);
    expect(ids(movePlacedToPosition(state(["a", "b", "c"]), 2, 0)).placed).toEqual(["c", "a", "b"]);
  });

  it("returns a removed product to the top of the unplaced group", () => {
    expect(ids(unplace(state(["a", "b"], ["x"]), 1))).toEqual({ placed: ["a"], unplaced: ["b", "x"] });
  });

  it("places an unplaced product at the top or the bottom", () => {
    expect(ids(place(state(["a"], ["x", "y"]), 1, "top"))).toEqual({ placed: ["y", "a"], unplaced: ["x"] });
    expect(ids(place(state(["a"], ["x", "y"]), 0, "bottom"))).toEqual({ placed: ["a", "x"], unplaced: ["y"] });
  });

  it("places everything left, below the order, keeping the shop's current order", () => {
    expect(ids(placeAll(state(["a"], ["x", "y"])))).toEqual({ placed: ["a", "x", "y"], unplaced: [] });
  });

  it("ignores an index that is out of range", () => {
    const s = state(["a"], ["x"]);
    expect(unplace(s, 5)).toBe(s);
    expect(place(s, 5, "top")).toBe(s);
  });

  it("is dirty only when the placed order differs from the saved one", () => {
    const saved = state(["a", "b"], ["x"]);
    expect(isDirty(saved, saved)).toBe(false);
    expect(isDirty(movePlaced(saved, 0, 1), saved)).toBe(true);
    expect(isDirty(place(saved, 0, "bottom"), saved)).toBe(true);
    expect(placedIds(saved)).toEqual(["a", "b"]);
  });

  it("matches names case-insensitively, and a blank search matches all", () => {
    expect(matchesSearch(row("a", "Blue Panjabi"), "panj")).toBe(true);
    expect(matchesSearch(row("a", "Blue Panjabi"), "  ")).toBe(true);
    expect(matchesSearch(row("a", "Blue Panjabi"), "saree")).toBe(false);
  });
});
