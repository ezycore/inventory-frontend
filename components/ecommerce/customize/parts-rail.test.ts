// coding-standard: maintained

import { describe, expect, it } from "vitest";

import {
  asPartId,
  LOOK,
  RAIL_GROUPS,
} from "@/components/ecommerce/customize/parts-rail";
import { PART_IDS } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * The rail's grouping is a hand-written list beside a `Record<PartId, …>` that
 * the compiler completes for you. Adding a part therefore type-checks the moment
 * its dirty-tracking slice exists, and renders nowhere until someone remembers
 * to put it in a group — a setting saved by the payload, tracked by the save
 * bar, and unreachable in the UI.
 *
 * That is not hypothetical bookkeeping: this file exists because the flat list
 * it replaced held every part in one array where the omission would at least
 * have been visible. Split across five arrays, it would not be.
 */
const grouped = RAIL_GROUPS.flatMap((group) => group.parts.map((p) => p.id));
const rail = [LOOK.id, ...grouped];

describe("the rail reaches every part", () => {
  it("renders each part exactly once", () => {
    expect([...rail].sort()).toEqual([...PART_IDS].sort());
  });

  it("keeps Look out of the groups", () => {
    // It is the one part that changes every other one, so it sits above them —
    // and a group heading called Look over a row called Look reads as a fault.
    expect(grouped).not.toContain("look");
  });

  it("gives every group a distinct name", () => {
    const titles = RAIL_GROUPS.map((g) => g.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("asPartId", () => {
  it("accepts a live part id", () => {
    expect(asPartId("hero")).toBe("hero");
  });

  it("rejects anything else", () => {
    expect(asPartId("nonsense")).toBeNull();
    expect(asPartId(null)).toBeNull();
  });

  // `?part=` is a documented deep link. A bookmark or a support reply written
  // before Brand and Design merged must still open the panel that absorbed them
  // rather than silently landing on a collapsed rail.
  it.each(["brand", "design"])("maps the retired %s id onto Look", (retired) => {
    expect(asPartId(retired)).toBe("look");
  });
});
