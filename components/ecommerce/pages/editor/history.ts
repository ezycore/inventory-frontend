// coding-standard: maintained
/**
 * Undo and redo over whole snapshots of the page's sections. Pure, so its rules
 * are tested directly; `usePageEditor` holds one of these as state.
 */

export interface History<T> {
  past: T[];
  present: T;
  future: T[];
}

/** Steps kept to undo. Each is a reference to a snapshot, not a deep copy. */
export const HISTORY_LIMIT = 100;

export const startHistory = <T>(present: T): History<T> => ({ past: [], present, future: [] });

/**
 * A new present, which makes any redo impossible. With `merge` it replaces the
 * current step instead of adding one — the caller decides when edits belong
 * together (typing a word in one field is one step, not one per letter).
 */
export function record<T>(history: History<T>, next: T, merge = false): History<T> {
  if (next === history.present) return history;
  return {
    past: merge ? history.past : [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
  };
}

export function undo<T>(history: History<T>): History<T> {
  if (history.past.length === 0) return history;
  return {
    past: history.past.slice(0, -1),
    present: history.past[history.past.length - 1],
    future: [history.present, ...history.future],
  };
}

export function redo<T>(history: History<T>): History<T> {
  if (history.future.length === 0) return history;
  const [next, ...rest] = history.future;
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: rest,
  };
}
