// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { HISTORY_LIMIT, record, redo, startHistory, undo } from "../history";

describe("editor history", () => {
  it("undoes and redoes step by step, and a new edit drops what could be redone", () => {
    let history = startHistory("a");
    history = record(history, "b");
    history = record(history, "c");
    history = undo(history);
    expect(history.present).toBe("b");
    history = undo(history);
    expect(history.present).toBe("a");
    history = redo(history);
    expect(history.present).toBe("b");

    history = record(history, "d");
    expect(history.future).toEqual([]);
    expect(redo(history)).toBe(history);
  });

  it("folds a merged edit into the current step, so one undo takes it all back", () => {
    let history = record(startHistory("E"), "Ei");
    history = record(history, "Eid", true);
    expect(undo(history).present).toBe("E");
  });

  it("does nothing past either end, or for an edit that changes nothing", () => {
    const history = startHistory("a");
    expect(undo(history)).toBe(history);
    expect(redo(history)).toBe(history);
    expect(record(history, "a")).toBe(history);
  });

  it(`keeps at most ${HISTORY_LIMIT} steps`, () => {
    let history = startHistory(0);
    for (let step = 1; step <= HISTORY_LIMIT + 20; step += 1) history = record(history, step);
    expect(history.past).toHaveLength(HISTORY_LIMIT);
    expect(history.past[0]).toBe(20);
  });
});
