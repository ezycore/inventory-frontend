// coding-standard: maintained
import { renderWithProviders as render, screen } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OrderReopenDialog, canReopen } from "./order-reopen-dialog";

/**
 * Reopen is offered only where the server allows it — a closed order whose advance
 * was not refunded — and it never sends without a reason.
 */
const mutation = { mutate: vi.fn(), isPending: false };
vi.mock("@/services/api", () => ({ useReopenOrder: () => mutation }));
vi.mock("@/hooks/use-order-status-labels", () => ({
  useOrderStatusLabels: () => ({ labelFor: (s: string) => s }),
}));

const order = (overrides: Record<string, unknown>) =>
  ({ _id: "o1", status: "cancelled", paymentStatus: "pending", ...overrides }) as never;

describe("canReopen", () => {
  it("offers it on a cancelled or rejected order", () => {
    expect(canReopen(order({ status: "cancelled" }))).toBe(true);
    expect(canReopen(order({ status: "rejected" }))).toBe(true);
  });

  it("not on a live order", () => {
    expect(canReopen(order({ status: "pending" }))).toBe(false);
    expect(canReopen(order({ status: "confirmed" }))).toBe(false);
  });

  it("not once the advance was refunded, even half-way", () => {
    expect(canReopen(order({ paymentStatus: "refunded" }))).toBe(false);
    expect(canReopen(order({ prepaidRefundGoodsTxnId: "t1" }))).toBe(false);
    expect(canReopen(order({ prepaidRefundShippingTxnId: "t1" }))).toBe(false);
  });
});

describe("OrderReopenDialog", () => {
  it("renders nothing where reopen is not allowed", () => {
    render(<OrderReopenDialog order={order({ status: "pending" })} />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("needs a reason, then sends it trimmed", async () => {
    mutation.mutate.mockClear();
    render(<OrderReopenDialog order={order({})} />);

    await userEvent.click(screen.getByRole("button", { name: /reopen order/i }));
    const confirm = screen.getAllByRole("button", { name: /reopen order/i }).at(-1)!;
    expect(confirm).toBeDisabled();

    await userEvent.type(screen.getByRole("textbox"), "  Customer called back ");
    await userEvent.click(confirm);

    expect(mutation.mutate).toHaveBeenCalledWith(
      { id: "o1", note: "Customer called back" },
      expect.anything(),
    );
  });
});
