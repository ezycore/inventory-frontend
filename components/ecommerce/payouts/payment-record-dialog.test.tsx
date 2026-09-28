// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CourierBalance, CourierParcel } from "@/services/api";
import { PaymentRecordDialog } from "./payment-record-dialog";

/**
 * "Record payment received" — one form for every courier (backend
 * `courier-settlement-manual.md` §4.3 D). Parcels are pre-ticked oldest first; a difference is
 * shown and never blocked (D3) — the server decides shortfall vs adjustment.
 */
const record = vi.hoisted(() => ({
  mutateAsync: vi.fn().mockResolvedValue({ data: {} }),
  isPending: false,
}));
const accounts = vi.hoisted(() => ({ accountsEnabled: false }));

vi.mock("@/services/api", () => ({ useRecordCourierPayment: () => record }));
vi.mock("@/hooks/use-order-account-options", () => ({
  useOrderAccountOptions: () => ({
    accountsEnabled: accounts.accountsEnabled,
    options: [{ label: "bKash", value: "acc-1" }],
  }),
}));
vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { currency: "BDT" } } }),
}));

const balance = {
  courierKey: "steadfast",
  label: "Steadfast",
  provider: "steadfast",
  shortfall: 0,
} as unknown as CourierBalance;

const parcels = [
  {
    orderId: "o1",
    orderNumber: "ORD-1",
    kind: "delivered",
    owed: 510,
    ageDays: 5,
    settled: true,
  },
  {
    orderId: "o2",
    orderNumber: "ORD-2",
    kind: "returned",
    owed: -60,
    ageDays: 3,
    settled: true,
  },
] as unknown as CourierParcel[];

const open = async () => {
  const user = userEvent.setup();
  render(
    <PaymentRecordDialog
      balance={balance}
      parcels={parcels}
      trigger={<button>Record payment received</button>}
    />,
  );
  await user.click(
    screen.getByRole("button", { name: "Record payment received" }),
  );
  return user;
};

describe("PaymentRecordDialog", () => {
  beforeEach(() => {
    record.mutateAsync.mockClear();
    accounts.accountsEnabled = false;
  });

  it("starts with every open parcel ticked and the expected net as the amount", async () => {
    await open();
    expect(screen.getByRole("checkbox", { name: /ORD-1/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /ORD-2/ })).toBeChecked();
    expect(screen.getByText("Matches")).toBeInTheDocument();
  });

  it("shows a shortfall and still saves it, with the ticked parcels", async () => {
    const user = await open();
    const amount = screen.getByLabelText("Amount received");
    await user.clear(amount);
    await user.type(amount, "400");
    await user.tab();
    // Re-ticked oldest first: ORD-1's 510 covers 400 on its own.
    expect(screen.getByRole("checkbox", { name: /ORD-2/ })).not.toBeChecked();
    expect(screen.getByText("Short by")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Record payment" }));
    expect(record.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "steadfast",
        amount: 400,
        orderIds: ["o1"],
      }),
    );
  });

  it("asks why a short payment is short, and sends extra courier charges when chosen", async () => {
    const user = await open();
    const amount = screen.getByLabelText("Amount received");
    await user.clear(amount);
    await user.type(amount, "440"); // re-ticks ORD-1 alone; tick ORD-2 back → expected 450
    await user.tab();
    await user.click(screen.getByRole("checkbox", { name: /ORD-2/ }));
    expect(screen.getByText(/What is the/)).toBeInTheDocument();
    await user.click(screen.getByLabelText(/Extra courier charges/));

    await user.click(screen.getByRole("button", { name: "Record payment" }));
    expect(record.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 440,
        orderIds: ["o1", "o2"],
        shortReason: "courier_charges",
      }),
    );
  });

  it("reopens on the parcels still open, not the ones the last payment covered", async () => {
    // Found in browser QA: state reset at close time captured the old parcels, so the next
    // open offered an already-paid parcel and its amount.
    const user = userEvent.setup();
    const trigger = <button>Record payment received</button>;
    const { rerender } = render(
      <PaymentRecordDialog
        balance={balance}
        parcels={parcels}
        trigger={trigger}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Record payment received" }),
    );
    await user.click(screen.getByRole("button", { name: "Record payment" }));

    // The payment covered both parcels; only a ৳10 shortfall is left on the card.
    rerender(
      <PaymentRecordDialog
        balance={{ ...balance, shortfall: 10 } as CourierBalance}
        parcels={[]}
        trigger={trigger}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: "Record payment received" }),
    );
    expect(screen.getByLabelText("Amount received")).toHaveValue("10");
    expect(screen.getByText("Recovers earlier shortfall")).toBeInTheDocument();

    record.mutateAsync.mockClear();
    await user.click(screen.getByRole("button", { name: "Record payment" }));
    expect(record.mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 10, orderIds: [] }),
    );
  });

  it("needs the account the money landed in when accounts are on", async () => {
    accounts.accountsEnabled = true;
    await open();
    expect(
      screen.getByRole("button", { name: "Record payment" }),
    ).toBeDisabled();
  });
});
