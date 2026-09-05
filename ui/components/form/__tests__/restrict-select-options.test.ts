// coding-standard: maintained
/**
 * Some fields must stay while some of their CHOICES stop being real.
 *
 * The case this exists for: a Discount carries
 * `applicableTo: "sales" | "purchase" | "both"`, and a merchant without the
 * purchasing module could pick "Purchase Only" — saving a record that applies to
 * a module they do not have, from a select that presented it as an ordinary
 * choice. `omitFormFields` is no help: removing `applicableTo` outright takes
 * the sales side with it and blocks a required field.
 */
import { describe, it, expect } from "vitest";
import { restrictSelectOptions } from "../form-utils";

const config = () => ({
  fields: [
    {
      name: "applicableTo",
      type: "select",
      defaultValue: "both",
      options: [
        { value: "both", label: "Both (Sales & Purchase)" },
        { value: "sales", label: "Sales Only" },
        { value: "purchase", label: "Purchase Only" },
      ],
    },
    { name: "name", type: "input" },
  ],
});

const optionsOf = (c: any) =>
  c.fields
    .find((f: any) => f.name === "applicableTo")
    .options.map((o: any) => o.value);

describe("restrictSelectOptions", () => {
  it("keeps only the allowed choices", () => {
    const out = restrictSelectOptions(config(), { applicableTo: ["sales"] });
    expect(optionsOf(out)).toEqual(["sales"]);
  });

  it("moves a default that no longer exists onto a surviving option", () => {
    // "both" is the shipped default. Leaving it selected on a sales-only
    // workspace renders a required select with no matching option — blank on
    // screen, and the save refuses with nothing to point at.
    const out = restrictSelectOptions(config(), { applicableTo: ["sales"] });
    expect(out.fields[0].defaultValue).toBe("sales");
  });

  it("leaves a default that survived the filter alone", () => {
    const out = restrictSelectOptions(config(), {
      applicableTo: ["both", "sales"],
    });
    expect(out.fields[0].defaultValue).toBe("both");
  });

  it("ignores fields it was not asked about", () => {
    const out = restrictSelectOptions(config(), { applicableTo: ["sales"] });
    expect(out.fields[1]).toEqual({ name: "name", type: "input" });
  });

  it("leaves the config untouched for an empty allow-list", () => {
    // An empty list means the caller computed nothing, not that nothing is
    // allowed — and a select with no options is worse than an unfiltered one.
    const before = config();
    expect(restrictSelectOptions(before, { applicableTo: [] })).toBe(before);
    expect(restrictSelectOptions(before, {})).toBe(before);
  });

  it("returns the same object when nothing was actually removed", () => {
    const before = config();
    const out = restrictSelectOptions(before, {
      applicableTo: ["both", "sales", "purchase"],
    });
    expect(out.fields[0]).toBe(before.fields[0]);
  });
});
