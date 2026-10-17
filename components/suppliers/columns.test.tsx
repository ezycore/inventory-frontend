// coding-standard: maintained
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import type { CellContext } from "@tanstack/react-table";

import { renderWithProviders, screen } from "@/tests/test-utils";
import type { Supplier } from "@/types";
import { getSupplierColumns, type SupplierColumnModes } from "./columns";

/**
 * The supplier list's Due column — what the shop still owes each supplier, with
 * Pay beside it (not in the actions column, so every row's icons line up).
 */
const t = ((key: string) => key) as never;
const headers = (modes: SupplierColumnModes) =>
  getSupplierColumns(t, modes).map((column) => column.header);

function renderDueCell(
  supplier: Partial<Supplier>,
  onPay?: (s: Supplier) => void,
) {
  const due = getSupplierColumns(t, { tracksMoney: true, onPay }).find(
    (c) => "accessorKey" in c && c.accessorKey === "totalDue",
  );
  const cell = due?.cell as (
    ctx: CellContext<Supplier, unknown>,
  ) => React.ReactNode;
  return renderWithProviders(
    <>
      {cell({ row: { original: supplier as Supplier } } as CellContext<
        Supplier,
        unknown
      >)}
    </>,
  );
}

describe("supplier columns", () => {
  it("shows Due only while the shop tracks money (accounts on)", () => {
    expect(headers({ tracksMoney: true })).toContain("columns.due");
    expect(headers({ tracksMoney: false })).not.toContain("columns.due");
  });

  it("has no Updated column — the last-edit time decides nothing", () => {
    expect(headers({ tracksMoney: true })).not.toContain("columns.updatedDate");
  });

  it("shows Pay beside an amount owed and hands the supplier back", async () => {
    const onPay = vi.fn();
    renderDueCell({ _id: "s1", totalDue: 1200 }, onPay);
    await userEvent.click(screen.getByRole("button", { name: /columns.pay/ }));
    expect(onPay).toHaveBeenCalledWith(expect.objectContaining({ _id: "s1" }));
  });

  it("shows the amount alone when nothing is owed, or the user cannot pay", () => {
    renderDueCell({ _id: "s2", totalDue: 0 }, vi.fn());
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    renderDueCell({ _id: "s3", totalDue: 1200 });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
