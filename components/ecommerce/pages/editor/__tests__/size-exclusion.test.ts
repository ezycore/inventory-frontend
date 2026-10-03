// coding-standard: maintained
import { describe, expect, it } from "vitest";
import type { SectionFieldSpec } from "@/lib/storefront-builder/field-specs";
import { SECTION_SPECS } from "@/lib/storefront-builder/section-specs";
import { withFieldValue } from "../section-instances";
import { clearRivalSize, inheritedRivalNote } from "../size-exclusion";

const specs = SECTION_SPECS.hero.settings as Record<string, SectionFieldSpec>;

/** The settings after the merchant sets `key` on `device`, run through the rule. */
const edit = (settings: Record<string, unknown>, key: string, value: unknown, device: "desktop" | "mobile") =>
  clearRivalSize("hero", key, withFieldValue(settings, key, specs[key], value, device), specs, device);

describe("hero shape vs height", () => {
  it("picking a shape clears the desktop height, and says so", () => {
    const result = edit({ layout: "full-bleed", height: { base: 475 } }, "frame", "9:16", "desktop");
    expect(result.settings.frame).toEqual({ base: "9:16" });
    expect(result.settings.height).toBeUndefined();
    expect(result.cleared).toMatch(/Hero height cleared on desktop/);
  });

  it("typing a height resets the desktop shape to Default", () => {
    const result = edit({ layout: "card", frame: { base: "16:9" } }, "height", 400, "desktop");
    expect(result.settings.height).toEqual({ base: 400 });
    expect(result.settings.frame).toBeUndefined();
    expect(result.cleared).toMatch(/Hero shape cleared on desktop/);
  });

  it("only touches the screen being edited", () => {
    // The phone's own height survives a desktop shape, and the desktop's height a phone shape.
    const desktop = edit({ layout: "card", height: { base: 475, mobile: 300 } }, "frame", "4:3", "desktop");
    expect(desktop.settings.height).toEqual({ mobile: 300 });

    const phone = edit({ layout: "card", height: { base: 475, mobile: 300 } }, "frame", "1:1", "mobile");
    expect(phone.settings.height).toEqual({ base: 475 });
    expect(phone.settings.frame).toEqual({ mobile: "1:1" });
    expect(phone.cleared).toMatch(/on phones/);
  });

  it("does nothing when the other one is not set, or when a value is cleared", () => {
    expect(edit({ layout: "card" }, "frame", "4:3", "desktop").cleared).toBeUndefined();
    const emptied = edit({ layout: "card", frame: { base: "4:3" }, height: { base: 475 } }, "frame", undefined, "desktop");
    expect(emptied.settings.height).toEqual({ base: 475 });
    expect(emptied.cleared).toBeUndefined();
  });

  it("leaves other sections alone", () => {
    const promo = clearRivalSize("promo-cards", "height", { height: { base: 200 }, ratio: "4:3" }, specs, "desktop");
    expect(promo.cleared).toBeUndefined();
  });
});

describe("inheritedRivalNote", () => {
  it("warns when a phone shape is replaced by the height the phone follows", () => {
    const settings = { layout: "card", frame: { mobile: "1:1" }, height: { base: 475 } };
    expect(inheritedRivalNote("hero", "frame", settings, specs, "mobile")).toMatch(/desktop height \(475px\)/);
    expect(inheritedRivalNote("hero", "frame", settings, specs, "desktop")).toBeUndefined();
    expect(
      inheritedRivalNote("hero", "frame", { ...settings, height: { base: 475, mobile: 300 } }, specs, "mobile"),
    ).toBeUndefined();
  });
});
