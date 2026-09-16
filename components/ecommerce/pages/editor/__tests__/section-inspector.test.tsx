// coding-standard: maintained
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Radix's Switch and Select measure themselves; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

import { SectionInspector } from "../section-inspector";
import type { EditorSection } from "../section-instances";

const inspect = (section: EditorSection) =>
  render(
    <SectionInspector
      section={section}
      device="desktop"
      onChange={vi.fn()}
      onAddBlock={vi.fn()}
      onClose={vi.fn()}
    />,
  );

describe("SectionInspector — Show on", () => {
  it("offers both screens for a merchant's own section", () => {
    inspect({
      id: "cta",
      type: "call-to-action",
      v: 1,
      enabled: true,
      settings: { heading: "Need help?", buttonLabel: "Message us", buttonHref: "/pages/faq" },
    } as EditorSection);
    expect(screen.getByText("Show on")).toBeTruthy();
    expect(screen.getByLabelText("Phones")).toBeTruthy();
  });

  it("does not offer to hide a core section on either screen", () => {
    // The storefront skips a section hidden for a screen — a cart shown on
    // computers only is a phone shop with no cart — so the switch is not offered.
    inspect({ id: "cart", type: "cart-lines", v: 1, enabled: true, settings: {} } as EditorSection);
    expect(screen.queryByText("Show on")).toBeNull();
    expect(screen.queryByLabelText("Phones")).toBeNull();
    expect(screen.queryByLabelText("Computers and tablets")).toBeNull();
  });
});
