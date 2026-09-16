// coding-standard: maintained
import { renderWithProviders, screen } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

// Radix's Switch and Select measure themselves; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { SectionInspector } from "../section-inspector";
import type { EditorSection } from "../section-instances";

const inspect = (section: EditorSection) =>
  renderWithProviders(
    <SectionInspector
      section={section}
      device="desktop"
      onChange={() => {}}
      onAddBlock={() => {}}
      onClose={() => {}}
    />,
  );

/**
 * The inspector's two tabs: settings stay where they were under Content, and
 * Style draws the section's box — except for a section pinned to the screen,
 * which has none.
 */
describe("SectionInspector tabs", () => {
  it("opens on Content, and Style shows the box controls", async () => {
    inspect({
      id: "cta-1",
      type: "call-to-action",
      v: 1,
      enabled: true,
      settings: { heading: "Eid", buttonLabel: "Shop", buttonHref: "/products" },
    });
    expect(screen.getByText("Show on")).toBeTruthy();
    expect(screen.queryByText("Spacing")).toBeNull();

    await userEvent.click(screen.getByRole("tab", { name: "Style" }));
    for (const label of ["Background", "Spacing", "Width", "Text alignment", "Text colour"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByText("Show on")).toBeNull();
  });

  it("says a pinned section has no box to style", async () => {
    inspect({ id: "bar-1", type: "sticky-order-bar", v: 1, enabled: true, settings: {} });
    await userEvent.click(screen.getByRole("tab", { name: "Style" }));
    expect(screen.getByText(/pinned to the screen/)).toBeTruthy();
    expect(screen.queryByText("Spacing")).toBeNull();
  });
});
