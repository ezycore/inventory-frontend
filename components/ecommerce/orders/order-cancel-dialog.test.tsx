// coding-standard: maintained

import { renderWithProviders as render, screen } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderCancelDialog } from "./order-cancel-dialog";

/**
 * Rejecting an order (G10, backend `docs/features/business-modes.md`): 56 of 78 rejections at one
 * shop said "Other" and nothing else. "Other" must now say what it was. (A customer asking to
 * cancel is not a rejection — the order offers Cancel for that.)
 */
const mutate = vi.hoisted(() => vi.fn());
vi.mock("@/services/api", () => ({ useCancelOrder: () => ({ mutate, isPending: false }) }));
vi.mock("@/hooks/use-order-account-options", () => ({
  useOrderAccountOptions: () => ({ accountsEnabled: false, options: [] }),
}));
const stockTracked = vi.hoisted(() => ({ value: false }));
vi.mock("@/hooks/use-stock-tracked", () => ({ useStockTracked: () => stockTracked.value }));
vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { currency: "BDT" } } }),
}));
vi.mock("@/ui/components/simple-select", () => ({
  SimpleSelect: ({
    value,
    onValueChange,
    options,
    placeholder,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
  }) => (
    <select aria-label={placeholder} value={value} onChange={(e) => onValueChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

const open = async () => {
  const user = userEvent.setup();
  render(
    <OrderCancelDialog
      order={{ _id: "o1", status: "pending" } as never}
      reject
      trigger={<button>Open</button>}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Open" }));
  return user;
};
const rejectButton = () => screen.getByRole("button", { name: "Reject order" });

beforeEach(() => {
  mutate.mockReset();
  stockTracked.value = false;
});

describe("cancel dialog stock wording", () => {
  const openCancel = async (order: Record<string, unknown>) => {
    const user = userEvent.setup();
    render(
      <OrderCancelDialog
        order={{ _id: "o1", ...order } as never}
        trigger={<button>Open</button>}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open" }));
  };

  it("promises released stock on a confirmed order where stock is tracked", async () => {
    stockTracked.value = true;
    await openCancel({ status: "confirmed", stockReserved: true });
    expect(screen.getByRole("button", { name: "Cancel & release stock" })).toBeInTheDocument();
  });

  it("not on a new order — it was never holding any", async () => {
    stockTracked.value = true;
    await openCancel({ status: "pending", stockReserved: false });
    expect(screen.queryByText(/Reserved stock is released/)).toBeNull();
    expect(screen.getByRole("button", { name: "Cancel order" })).toBeInTheDocument();
  });

  it("not where stock is not tracked, even on a confirmed order", async () => {
    await openCancel({ status: "confirmed", stockReserved: true });
    expect(screen.queryByText(/Reserved stock is released/)).toBeNull();
    expect(screen.getByRole("button", { name: "Cancel order" })).toBeInTheDocument();
  });
});

describe("reject dialog reasons (G10)", () => {
  it("will not reject as Other until it says why", async () => {
    const user = await open();
    await user.selectOptions(screen.getByLabelText("Pick a reason"), "other");
    expect(rejectButton()).toBeDisabled();

    await user.type(screen.getByLabelText("What was the reason?"), "Asked for a different colour");
    await user.click(rejectButton());

    expect(mutate.mock.calls[0][0]).toMatchObject({
      reject: true,
      reason: "other",
      note: "Asked for a different colour",
    });
  });

  it("sends no note with a named reason", async () => {
    const user = await open();
    await user.selectOptions(screen.getByLabelText("Pick a reason"), "duplicate");
    await user.click(rejectButton());
    expect(mutate.mock.calls[0][0]).toMatchObject({ reason: "duplicate" });
    expect(mutate.mock.calls[0][0].note).toBeUndefined();
  });
});
