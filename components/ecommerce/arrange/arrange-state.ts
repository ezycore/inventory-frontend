// coding-standard: maintained
import type { ProductOrderRow } from "@/services/api";

/**
 * The Arrange screen's working copy of one listing's order
 * (inventory-backend `docs/plan/storefront-product-order.md` §7).
 *
 * `placed` is the merchant's order, first product first. `unplaced` is the rest
 * of the listing, in the order shoppers see it today — the server sends it that
 * way, and these moves never re-sort it, so "Not placed yet" always reads as
 * "what the shop shows after your list".
 *
 * Every function is pure and returns a new state; nothing here is saved until
 * the screen's Save button sends `placed`.
 */
export interface ArrangeState {
  placed: ProductOrderRow[];
  unplaced: ProductOrderRow[];
}

const move = <T>(list: readonly T[], from: number, to: number): T[] => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max);

/** Moves a placed product from one position to another (indexes, splice semantics). */
export const movePlaced = (state: ArrangeState, from: number, to: number): ArrangeState =>
  from === to ? state : { ...state, placed: move(state.placed, from, clamp(to, state.placed.length - 1)) };

/** Moves a placed product to a 1-based position, as the merchant types it. */
export const movePlacedToPosition = (state: ArrangeState, from: number, position: number): ArrangeState =>
  movePlaced(state, from, Math.round(position) - 1);

/** Takes a product out of the order; it rejoins the unplaced group at its top, where it can be seen. */
export const unplace = (state: ArrangeState, index: number): ArrangeState => {
  const row = state.placed[index];
  if (!row) return state;
  return {
    placed: state.placed.filter((_, i) => i !== index),
    unplaced: [row, ...state.unplaced],
  };
};

/** Places an unplaced product at the top or the bottom of the order. */
export const place = (state: ArrangeState, index: number, where: "top" | "bottom"): ArrangeState => {
  const row = state.unplaced[index];
  if (!row) return state;
  return {
    placed: where === "top" ? [row, ...state.placed] : [...state.placed, row],
    unplaced: state.unplaced.filter((_, i) => i !== index),
  };
};

/** Places every remaining product below the order, in the order the shop shows them now. */
export const placeAll = (state: ArrangeState): ArrangeState => ({
  placed: [...state.placed, ...state.unplaced],
  unplaced: [],
});

/** The ids to save. */
export const placedIds = (state: ArrangeState): string[] => state.placed.map((row) => row._id);

/** Has the merchant changed the order since it was loaded or saved? */
export const isDirty = (state: ArrangeState, saved: ArrangeState): boolean => {
  const current = placedIds(state);
  const original = placedIds(saved);
  return current.length !== original.length || current.some((id, i) => id !== original[i]);
};

/** Case-insensitive name match for the search box; blank matches everything. */
export const matchesSearch = (row: ProductOrderRow, search: string): boolean => {
  const term = search.trim().toLowerCase();
  return !term || row.name.toLowerCase().includes(term);
};
