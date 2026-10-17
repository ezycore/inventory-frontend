// coding-standard: maintained
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import type { CellContext } from "@tanstack/react-table";

import { renderWithProviders, screen } from "@/tests/test-utils";
import type { Customer } from "@/types";
import { getCustomerColumns } from "./columns";

/**
 * Receive lives in the Due cell, beside the amount it settles — only on a row
 * that owes, and only when the page passes a handler (accounts on + sales.edit).
 */
const t = ((key: string) => key) as never;

function renderDueCell(
  customer: Partial<Customer>,
  onReceivePayment?: (c: Customer) => void,
) {
  const due = getCustomerColumns(t, {
    tracksMoney: true,
    online: false,
    counter: true,
    onReceivePayment,
  }).find((c) => "accessorKey" in c && c.accessorKey === "totalDue");
  const cell = due?.cell as (
    ctx: CellContext<Customer, unknown>,
  ) => React.ReactNode;
  return renderWithProviders(
    <>
      {cell({ row: { original: customer as Customer } } as CellContext<
        Customer,
        unknown
      >)}
    </>,
  );
}

describe("Due cell", () => {
  it("shows Receive beside an amount owed and hands the customer back", async () => {
    const onReceive = vi.fn();
    renderDueCell({ _id: "c1", totalDue: 300 }, onReceive);
    await userEvent.click(
      screen.getByRole("button", { name: /columns.receive/ }),
    );
    expect(onReceive).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "c1" }),
    );
  });

  it("shows the amount alone when nothing is owed", () => {
    renderDueCell({ _id: "c2", totalDue: 0 }, vi.fn());
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the amount alone when the user cannot take payments", () => {
    renderDueCell({ _id: "c3", totalDue: 300 });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
