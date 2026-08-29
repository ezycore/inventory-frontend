// coding-standard: maintained
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/tests/test-utils";
import { MultiSelect } from "../multi-select";

/**
 * `value` is a controlled prop and has to keep working after the first render.
 *
 * It used to seed the internal `selectedValues` state and never be read again,
 * so a selection set from OUTSIDE the trigger silently did nothing: quick-add
 * created a tag, appended its id to the form field, and the chip never showed
 * up — the form held one more tag than the control drew.
 *
 * Asserted through the live region rather than the badges: how many badges are
 * painted is a measured, width-dependent decision, and jsdom has no layout.
 */

const options = [
  { label: "Newborn", value: "t1" },
  { label: "Gift Pack", value: "t2" },
  { label: "Clearance", value: "t3" },
];

// The trigger's own live region — the toast portal also claims aria-live.
const selection = () =>
  document.querySelector('[aria-live="polite"][id$="-count"]')?.textContent ?? "";

const view = (value: string[]) => (
  <MultiSelect options={options} value={value} onValueChange={vi.fn()} />
);

describe("MultiSelect controlled value", () => {
  it("picks up a value appended by the parent after mount", () => {
    const { rerender } = renderWithProviders(view(["t1"]));
    expect(selection()).toContain("1 option selected: Newborn");

    rerender(view(["t1", "t2"]));

    expect(selection()).toContain("2 options selected: Newborn, Gift Pack");
  });

  it("drops a value the parent removed", () => {
    const { rerender } = renderWithProviders(view(["t1", "t2"]));
    rerender(view(["t2"]));

    expect(selection()).toContain("1 option selected: Gift Pack");
  });

  it("reflects the whole selection, not just what fits on the row", () => {
    renderWithProviders(view(["t1", "t2", "t3"]));

    expect(screen.getByRole("combobox").getAttribute("aria-label")).toContain(
      "3 of 3 options selected",
    );
  });
});
