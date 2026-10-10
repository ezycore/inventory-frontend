// coding-standard: maintained

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderItemsReturnDialog } from "./order-items-return-dialog";

/**
 * "Return items" — some of a delivered, paid order coming back (G5).
 *
 * The dialog prices nothing itself: the lines, what is still returnable on each, the refund and
 * whether it needs a destination all come from the server's preview. These tests pin that it
 * sends exactly the ticked lines (variant included), asks where paid money goes when the server
 * says so, and cannot claim more than is left.
 */
const mutate = vi.hoisted(() => vi.fn());
const accounts = vi.hoisted(() => ({ enabled: true }));

const LINES = [
  { productId: "p", variantId: "s", productName: "Shirt S", sold: 2, returned: 1, returnable: 1 },
  { productId: "p", variantId: "l", productName: "Shirt L", sold: 1, returned: 0, returnable: 1 },
];

vi.mock("@/services/api", () => ({
  useReturnOrder: () => ({ mutate, isPending: false }),
  useOrderReturnPreview: (_id: string, enabled: boolean, lines?: { quantity: number }[]) => {
    if (!enabled) return { data: undefined, isFetching: false };
    const goods = (lines ?? []).reduce((sum, line) => sum + line.quantity * 500, 0);
    return {
      data: {
        lines: LINES,
        goodsRefund: goods,
        deduction: 0,
        refundRemainder: goods,
        refundModeRequired: accounts.enabled && goods > 0,
      },
      isFetching: false,
    };
  },
}));
vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { currency: "BDT" } } }),
}));
vi.mock("@/hooks/use-order-account-options", () => ({
  useOrderAccountOptions: () => ({
    accountsEnabled: accounts.enabled,
    options: [{ value: "acc-1", label: "Cash" }],
  }),
}));
vi.mock("@/hooks/use-stock-tracked", () => ({ useStockTracked: () => false }));
// A native select, so a test can pick an option without driving Radix's portal.
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
    <OrderItemsReturnDialog
      order={{ _id: "order-1" } as never}
      trigger={<button>Open</button>}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Open" }));
  return user;
};
const submit = () => screen.getByRole("button", { name: "Return items" });
const pickReason = (user: ReturnType<typeof userEvent.setup>, value: string) =>
  user.selectOptions(screen.getByLabelText("Pick a reason"), value);
const setQty = async (user: ReturnType<typeof userEvent.setup>, label: RegExp, value: string) => {
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.type(field, value);
  await user.tab();
};

beforeEach(() => {
  mutate.mockReset();
  accounts.enabled = true;
});

describe("Return items dialog (G5)", () => {
  it("lists each line with what earlier returns already took", async () => {
    await open();
    expect(screen.getByText("2 sold · 1 already returned")).toBeInTheDocument();
    expect(screen.getByText("1 sold")).toBeInTheDocument();
  });

  it("waits for something to be ticked", async () => {
    await open();
    expect(submit()).toBeDisabled();
  });

  it("sends only the ticked line, with its variant, and where the paid money goes", async () => {
    const user = await open();
    await setQty(user, /return shirt l/i, "1");
    expect(submit(), "a reason is required").toBeDisabled();
    await pickReason(user, "wrong_item");

    expect(screen.getByText("Refund the paid amount")).toBeInTheDocument();
    await user.click(screen.getByLabelText(/store credit/i));
    await waitFor(() => expect(submit()).toBeEnabled());
    await user.click(submit());

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toMatchObject({
      id: "order-1",
      returnLines: [{ productId: "p", variantId: "l", quantity: 1 }],
      reason: "wrong_item",
      refund: { mode: "credit" },
    });
    expect(mutate.mock.calls[0][0].idempotencyKey).toBeTruthy();
  });

  it("cannot claim more than is left on a line", async () => {
    const user = await open();
    await setQty(user, /return shirt s/i, "5");
    expect(screen.getByLabelText(/return shirt s/i)).toHaveValue("1");
  });

  it("with accounts off, asks no destination and says money is not tracked", async () => {
    accounts.enabled = false;
    const user = await open();
    await setQty(user, /return shirt l/i, "1");

    expect(screen.queryByText("Refund the paid amount")).toBeNull();
    expect(screen.getByText(/not tracked in your accounts/i)).toBeInTheDocument();
    await pickReason(user, "customer_changed_mind");
    await user.click(submit());
    expect(mutate.mock.calls[0][0].refund).toBeUndefined();
  });
});
