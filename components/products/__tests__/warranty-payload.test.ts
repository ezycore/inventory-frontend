// coding-standard: maintained
/**
 * Warranty is flat on the product form and one nested `warranty` object on
 * the wire. Tested at the payload, like "Publish to store": a wrong shape saves
 * without an error and simply loses the warranty the merchant typed.
 */
import { describe, expect, it } from "vitest";
import { makePrepareSubmitData } from "../helpers";

const t = ((key: string) => key) as never;
const prepare = makePrepareSubmitData(t);

const readWarranty = (fd: FormData) => {
  const raw = fd.get("warranty");
  return typeof raw === "string" ? JSON.parse(raw) : undefined;
};

describe("warranty payload", () => {
  it("nests the fields under `warranty` and drops the flat keys", () => {
    const fd = prepare(
      { name: "Blender", price: 900, warrantyMonths: 12, warrantyKind: "service", warrantyNote: " Motor only " },
      false,
    );
    expect(readWarranty(fd)).toEqual({ months: 12, kind: "service", note: "Motor only" });
    expect(fd.get("warrantyMonths")).toBeNull();
    expect(fd.get("warrantyKind")).toBeNull();
  });

  it("sends null when the section was shown with months left empty — clears it on edit", () => {
    const fd = prepare({ name: "Blender", price: 900, warrantyMonths: undefined }, true, {});
    expect(fd.get("warranty")).toBe("null");
  });

  it("sends nothing when the section was stripped (feature off)", () => {
    const fd = prepare({ name: "Blender", price: 900 }, true, {});
    expect(fd.get("warranty")).toBeNull();
  });

  it("defaults the kind to replacement", () => {
    const fd = prepare({ name: "Blender", price: 900, warrantyMonths: 6 }, false);
    expect(readWarranty(fd)).toEqual({ months: 6, kind: "replacement" });
  });
});
