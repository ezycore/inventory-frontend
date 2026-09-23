// coding-standard: maintained
import { describe, expect, it, vi } from "vitest";
import { fireEvent, renderWithProviders, screen } from "@/tests/test-utils";
import { Dialog, DialogContent, DialogTitle } from "../dialog";
import { FuseAdvancedSelect } from "../fuse-advanced-select";
import { MultiSelect } from "../multi-select";

/**
 * Both option lists are popovers, and a popover portalled to `document.body`
 * from inside a dialog lands OUTSIDE `react-remove-scroll`'s lock. The lock
 * cancels every `wheel` and `touchmove` whose target is neither in the locked
 * element nor in its shards — Radix shards only the dialog's own content node —
 * so a portalled list could be scrolled by dragging its scrollbar and by
 * nothing else. The multi-select was reported that way (mouse wheel, 2026-09-22)
 * and the fuse listbox had the same defect for touch, its hand-rolled wheel
 * handler having covered only half of it.
 *
 * The fix is structural, so the assertion is structural: the list must render
 * inside the dialog, and must still portal when there is no dialog to stay in.
 */

const options = [
  { label: "Newborn", value: "t1" },
  { label: "Gift Pack", value: "t2" },
];

const dialogContent = () => document.querySelector('[data-slot="dialog-content"]');

const inDialog = (field: React.ReactNode) => (
  <Dialog open>
    <DialogContent>
      <DialogTitle>Add New Campaign</DialogTitle>
      {field}
    </DialogContent>
  </Dialog>
);

describe("option lists inside a scroll-locked overlay", () => {
  it("keeps the multi-select list inside the dialog", () => {
    renderWithProviders(inDialog(<MultiSelect options={options} onValueChange={vi.fn()} />));

    fireEvent.click(screen.getByRole("combobox"));

    const list = document.querySelector('[data-slot="command-list"]');
    expect(list).toBeTruthy();
    expect(dialogContent()?.contains(list!)).toBe(true);
  });

  it("portals the multi-select list when there is no lock to stay inside", () => {
    renderWithProviders(<MultiSelect options={options} onValueChange={vi.fn()} />);

    // Read the trigger BEFORE opening: the search box is a combobox too, so the
    // role is ambiguous once the list is up.
    fireEvent.click(screen.getByRole("combobox"));

    const list = document.querySelector('[data-slot="command-list"]');
    expect(list).toBeTruthy();
    expect(dialogContent()).toBeNull();
    // Radix portals to <body>; rendered in place it would sit in the render
    // tree's own container instead.
    const wrapper = list!.closest("[data-radix-popper-content-wrapper]");
    expect(wrapper?.parentElement).toBe(document.body);
  });

  it("keeps the fuse listbox inside the dialog", async () => {
    renderWithProviders(
      inDialog(
        <FuseAdvancedSelect id="tags" options={options} value="" onValueChange={vi.fn()} />,
      ),
    );

    // The fuse field opens on mousedown, which `click` does not dispatch.
    fireEvent.mouseDown(screen.getByRole("combobox"));

    const list = await screen.findByRole("listbox");
    expect(dialogContent()?.contains(list)).toBe(true);
  });
});
