import { describe, expect, it } from "vitest";
import { withProductTargets, withScreen } from "../section-visibility";
import type { EditorSection } from "../section-instances";

const CUSHIONS = "64b7f0c2a1b2c3d4e5f60720";
const section: EditorSection = { id: "guide", type: "rich-text", v: 1, enabled: true, settings: {} };

describe("a section's visibility", () => {
  it("stores nothing for a section shown everywhere", () => {
    expect(withScreen(withScreen(section, "mobile", false), "mobile", true)).not.toHaveProperty("visibility");
    expect(withProductTargets(section, undefined)).not.toHaveProperty("visibility");
    expect(withProductTargets(section, { categories: [] })).not.toHaveProperty("visibility");
  });

  it("keeps the products when a screen changes, and the screens when the products change", () => {
    const limited = withProductTargets(withScreen(section, "desktop", false), { categories: [CUSHIONS] });
    expect(limited.visibility).toEqual({ desktop: false, products: { categories: [CUSHIONS] } });
    expect(withScreen(limited, "desktop", true).visibility).toEqual({ products: { categories: [CUSHIONS] } });
    expect(withProductTargets(limited, undefined).visibility).toEqual({ desktop: false });
  });
});
