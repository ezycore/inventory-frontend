// coding-standard: maintained

import { renderWithProviders as render, screen } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderReturnDialog } from "./order-return-dialog";

/**
 * "Return whole order" — shadow test S22. Money a customer paid at the door on a refused
 * parcel is recorded in every mode: with Cash & Bank off it used to have no field at all, so
 * a custom courier's paid return could not reach the delivery margin. The account picker
 * belongs to the return charge only; door money goes to the courier's balance on the server.
 */
const mutate = vi.hoisted(() => vi.fn());
const accounts = vi.hoisted(() => ({ enabled: false }));

vi.mock("@/services/api", () => ({
  useReturnOrder: () => ({ mutate, isPending: false }),
  useOrderReturnPreview: (_id: string, enabled: boolean) => ({
    data: enabled
      ? { goodsRefund: 450, deduction: 0, refundRemainder: 0, refundModeRequired: false }
      : undefined,
    isLoading: false,
  }),
}));
vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { currency: "BDT" } } }),
}));
vi.mock("@/hooks/use-order-account-options", () => ({
  useOrderAccountOptions: () => ({
    accountsEnabled: accounts.enabled,
    options: [{ value: "acc-1", label: "Cash" }],
    defaultAccountId: "acc-1",
  }),
}));
vi.mock("@/hooks/use-stock-tracked", () => ({ useStockTracked: () => false }));

const shippedCustomCourier = {
  _id: "order-1",
  orderNumber: "ORD-1",
  status: "shipped",
  paymentMethod: "cod",
  courier: { integration: "manual", name: "Pathao (shadow)", normalizedStatus: "returned" },
};

const open = async (order = shippedCustomCourier) => {
  const user = userEvent.setup();
  render(<OrderReturnDialog order={order as never} trigger={<button>Return</button>} />);
  await user.click(screen.getByText("Return"));
  return user;
};

describe("OrderReturnDialog — money paid at the door (S22)", () => {
  beforeEach(() => {
    mutate.mockReset();
    accounts.enabled = false;
  });

  it("records door money with Cash & Bank off, and sends it", async () => {
    const user = await open();
    expect(screen.queryByText("Return courier charge"), "a ledger-only figure").toBeNull();
    const door = screen.getByText("Collected at door").parentElement!.querySelector("input")!;
    await user.type(door, "70");
    await user.click(screen.getByText("Process return"));
    expect(mutate.mock.calls[0][0]).toMatchObject({ id: "order-1", collectedAmount: 70 });
  });

  it("offers no account for door money — only for a return charge", async () => {
    accounts.enabled = true;
    const user = await open();
    const door = screen.getByText("Collected at door").parentElement!.querySelector("input")!;
    await user.type(door, "70");
    expect(screen.queryByText("Account for the return charge")).toBeNull();
    expect(screen.getByText(/goes on their balance, not into your/)).toBeInTheDocument();
    const charge = screen.getByText("Return courier charge").parentElement!.querySelector("input")!;
    await user.type(charge, "40");
    expect(screen.getByText("Account for the return charge")).toBeInTheDocument();
  });

  it("asks nothing about the door for a parcel that never left", async () => {
    await open({ ...shippedCustomCourier, status: "processing" });
    expect(screen.queryByText("Collected at door")).toBeNull();
  });
});
