// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PayoutPostDialog } from "./payout-post-dialog";
import type { CourierPayout } from "@/services/api";

/**
 * Posting is where the money actually moves, so the dialog guards two things.
 *
 * **A destination is required.** The net transfers out of the courier's clearing account into
 * a real one, and no poller can know which — that is precisely why the sweep records payouts
 * `pending` and stops. A post with no account chosen would transfer into nothing.
 *
 * **With the ledger module off there is nowhere to post.** The statement is still a fact worth
 * keeping, so it stays recorded and the dialog says why it cannot be booked — matching the
 * backend, which degrades the same way rather than refusing the screen.
 *
 * The account list comes from the payment-options endpoint, which excludes system accounts, so
 * a clearing account can never be offered as the destination of its own payout.
 */
const post = vi.hoisted(() => ({
  mutateAsync: vi.fn().mockResolvedValue({ data: {} }),
  isPending: false,
}));

const accounts = vi.hoisted(() => ({
  current: {
    accountsEnabled: true,
    options: [{ label: "bKash Merchant", value: "acc-1" }],
  },
}));

vi.mock("@/services/api", () => ({
  usePostCourierPayout: () => post,
}));

vi.mock("@/hooks/use-order-account-options", () => ({
  useOrderAccountOptions: () => accounts.current,
}));

vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { currency: "BDT" } } }),
}));

const payout = {
  _id: "payout-1",
  statementRef: "SFC-26926554",
  provider: "steadfast",
  gross: 810,
  net: 658,
  deductions: {
    delivery: 145,
    codFee: 0,
    paymentCharge: 7,
    returnCharge: 0,
    adjustment: 0,
  },
  status: "pending",
  reconciled: true,
  residual: 0,
  unrecordedGross: 0,
  lines: [],
} as unknown as CourierPayout;

describe("PayoutPostDialog", () => {
  beforeEach(() => {
    post.mutateAsync.mockClear();
    accounts.current = {
      accountsEnabled: true,
      options: [{ label: "bKash Merchant", value: "acc-1" }],
    };
  });

  it("will not post until the merchant says where the money landed", async () => {
    const user = userEvent.setup();
    render(<PayoutPostDialog payout={payout} />);
    await user.click(screen.getByRole("button", { name: /confirm & post/i }));

    expect(screen.getByRole("button", { name: /post to ledger/i })).toBeDisabled();
    // The deductions being agreed to are on screen before the button, not after it.
    expect(screen.getByText("Delivery")).toBeInTheDocument();
    expect(screen.getByText("Payment charge")).toBeInTheDocument();
    // A zero deduction is noise, not information.
    expect(screen.queryByText("COD fee")).not.toBeInTheDocument();
  });

  it("records but cannot post when cash & bank is switched off", async () => {
    accounts.current = { accountsEnabled: false, options: [] };
    const user = userEvent.setup();
    render(<PayoutPostDialog payout={payout} />);
    await user.click(screen.getByRole("button", { name: /confirm & post/i }));

    expect(screen.getByText(/switched off for this workspace/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /post to ledger/i })).toBeDisabled();
    expect(screen.queryByLabelText(/where it landed/i)).not.toBeInTheDocument();
  });
});
