// coding-standard: maintained
import { describe, expect, it, vi } from "vitest";
import type { ColumnDef } from "@tanstack/react-table";
import { renderWithProviders, screen } from "@/tests/test-utils";
import { fireEvent } from "@testing-library/react";
import { BaseDataTable } from "../base-data-table ";

/**
 * Row selection is keyed by `_id`, not by position.
 *
 * Keyed by index (TanStack's default) a server-paginated table carried "row 1"
 * from page 1 onto page 2: tick one product, page on, and a DIFFERENT product
 * showed ticked — and a bulk delete removed that one. Keyed by id, the tick
 * stays with its product, and selections add up across pages.
 */
type Row = { _id: string; name: string };
const columns: ColumnDef<Row>[] = [{ accessorKey: "name", header: "Name" }];
const page1: Row[] = [
  { _id: "a", name: "Alpha" },
  { _id: "b", name: "Bravo" },
];
const page2: Row[] = [
  { _id: "c", name: "Charlie" },
  { _id: "d", name: "Delta" },
];

const view = (data: Row[], onSelectionChange = vi.fn(), resetKey = "") => (
  <BaseDataTable<Row, unknown>
    data={data}
    columns={columns}
    isLoading={false}
    selectable
    onSelectionChange={onSelectionChange}
    selectionResetKey={resetKey}
    renderSelectionBar={(selection) => <p data-testid="count">{selection.ids.join(",")}</p>}
  />
);

const rowBox = (name: string) =>
  screen.getByText(name).closest("tr")!.querySelector("input[type=checkbox]") as HTMLInputElement;

describe("BaseDataTable selection", () => {
  it("keeps a tick with its row across pages, and adds selections up", () => {
    const onSelectionChange = vi.fn();
    const { rerender } = renderWithProviders(view(page1, onSelectionChange));

    fireEvent.click(rowBox("Alpha"));
    rerender(view(page2, onSelectionChange));

    // Same position on page 2, different product: not ticked.
    expect(rowBox("Charlie").checked).toBe(false);
    fireEvent.click(rowBox("Delta"));
    expect(screen.getByTestId("count").textContent).toBe("a,d");

    rerender(view(page1, onSelectionChange));
    expect(rowBox("Alpha").checked).toBe(true);
    expect(rowBox("Bravo").checked).toBe(false);

    // Rows from both pages reach the parent, not just the visible ones.
    const last = onSelectionChange.mock.calls.at(-1)?.[0] as Row[];
    expect(last.map((row) => row.name)).toEqual(["Alpha", "Delta"]);
  });

  it("clears the selection when the reset key (the filters) changes", () => {
    const { rerender } = renderWithProviders(view(page1, vi.fn(), "f1"));
    fireEvent.click(rowBox("Alpha"));
    expect(screen.getByTestId("count").textContent).toBe("a");

    rerender(view(page1, vi.fn(), "f2"));
    expect(screen.getByTestId("count").textContent).toBe("");
  });
});
