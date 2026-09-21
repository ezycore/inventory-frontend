// coding-standard: maintained
import { describe, expect, it } from "vitest";
import type { SalesBreakdownRow } from "@/services/api/modules/reports/api";
import { splitBreakdown } from "./sales-breakdown";

const row = (
  name: string,
  revenue: number,
  units = 0,
  orders = 0,
): SalesBreakdownRow => ({
  id: name,
  name,
  revenue,
  units,
  orders,
  share: 0,
  productCount: 1,
});

const names = (rows: { row: SalesBreakdownRow }[]) => rows.map((r) => r.row.name);

describe("splitBreakdown", () => {
  const rows = Array.from({ length: 12 }, (_, i) => row(`G${i + 1}`, (12 - i) * 100, i + 1));

  it("takes five from each end, lowest seller first", () => {
    const { top, bottom } = splitBreakdown(rows, "revenue");

    expect(names(top)).toEqual(["G1", "G2", "G3", "G4", "G5"]);
    expect(names(bottom)).toEqual(["G12", "G11", "G10", "G9", "G8"]);
    expect(bottom[0].rank).toBe(12);
  });

  it("re-ranks by the chosen metric", () => {
    // Units run the other way from revenue in this fixture.
    const { top, bottom } = splitBreakdown(rows, "units");

    expect(top[0].row.name).toBe("G12");
    expect(bottom[0].row.name).toBe("G1");
  });

  it("never lists a group in both halves when there are few", () => {
    const { top, bottom } = splitBreakdown(rows.slice(0, 7), "revenue");

    expect(names(top)).toEqual(["G1", "G2", "G3", "G4"]);
    expect(names(bottom)).toEqual(["G7", "G6", "G5"]);
  });

  it("puts a single group on top and leaves the bottom empty", () => {
    const { top, bottom } = splitBreakdown([row("Only", 50)], "revenue");

    expect(names(top)).toEqual(["Only"]);
    expect(bottom).toEqual([]);
  });

  it("breaks ties on revenue, then name, so the order is stable", () => {
    const tied = [row("Beta", 100, 3), row("Alpha", 100, 3), row("Gamma", 900, 3)];

    expect(names(splitBreakdown(tied, "units").ranked)).toEqual(["Gamma", "Alpha", "Beta"]);
  });
});
