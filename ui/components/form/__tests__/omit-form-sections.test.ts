// coding-standard: maintained
import { describe, expect, it } from "vitest";
import { omitFormSections } from "../form-utils";
import { productFormConfig } from "@/components/products/form-config";

/**
 * Dropping a whole section by its stable id.
 *
 * The bug this exists for: "Publish to store" belongs to exactly one tier, and
 * the gate dropped it by naming its fields — `isListed`, `onlinePrice`,
 * `onlineDescription`. The section later grew `weightKg` and `featured`, the
 * list did not, and those two survived on every other tier. They are hidden by a
 * `dependsOn` pointing at the very `isListed` checkbox the gate had removed, so
 * they rendered nothing — leaving a "Publish to store" card with a subtitle
 * promising the product goes live on save and no control at all beneath it.
 *
 * A section is now dropped as a section, so a sixth field is covered the day it
 * is added.
 */
describe("omitFormSections", () => {
  it("drops the named section and leaves the rest untouched", () => {
    const config = {
      sections: [
        { id: "a", title: "A", fields: [{ name: "one" }] },
        { id: "publish-to-store", title: "Publish", fields: [{ name: "two" }] },
        { title: "No id", fields: [{ name: "three" }] },
      ],
    };

    const result = omitFormSections(config, ["publish-to-store"]);

    expect(result.sections.map((s: { title: string }) => s.title)).toEqual([
      "A",
      "No id",
    ]);
  });

  it("is a no-op with no ids, and never drops an unnamed section", () => {
    const config = { sections: [{ title: "No id", fields: [] }] };
    expect(omitFormSections(config, [])).toBe(config);
    expect(omitFormSections(config, ["publish-to-store"]).sections).toHaveLength(1);
  });

  it("takes the whole publish section — every field, not a list of three", () => {
    // The regression guard. Read off the real config, so adding a sixth field
    // cannot quietly reintroduce the empty card.
    const config = productFormConfig;
    const publish = config.sections!.find((s) => s.id === "publish-to-store");
    expect(publish, "the section must keep its stable id").toBeDefined();
    expect(publish!.fields.length).toBeGreaterThan(3);

    const gated = omitFormSections(config, ["publish-to-store"]);
    const surviving = gated.sections!.flatMap((s) => s.fields.map((f) => f.name));
    for (const field of publish!.fields) {
      expect(surviving, `${field.name} survived the gate`).not.toContain(field.name);
    }
  });
});
