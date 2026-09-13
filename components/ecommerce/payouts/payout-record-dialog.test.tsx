// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PayoutRecordDialog } from "./payout-record-dialog";

/**
 * The record dialog files a courier's statement; it does not audit it.
 *
 * The figures go to the server exactly as the merchant typed them. The server re-derives the
 * reconciliation against the clearing balances — which this app never sees — and refuses
 * `gross − deductions ≠ net` outright. So the arithmetic beside the net field is a **hint**:
 * a statement that does not add up is a fact about the statement, and quietly replacing the
 * courier's net with a computed one would file something the courier never sent.
 *
 * That is the opposite responsibility from the collection dialog, which *does* block until the
 * merchant accounts for a gap — there the gap is theirs to explain, here it is the courier's.
 */
const record = vi.hoisted(() => ({
  mutateAsync: vi.fn().mockResolvedValue({ data: {} }),
  isPending: false,
}));

vi.mock("@/services/api", () => ({
  useRecordCourierPayout: () => record,
}));

vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { currency: "BDT" } } }),
}));

const openDialog = async () => {
  const user = userEvent.setup();
  render(<PayoutRecordDialog trigger={<button>Record a payout</button>} />);
  await user.click(screen.getByRole("button", { name: "Record a payout" }));
  return user;
};

const typeNumber = async (
  user: ReturnType<typeof userEvent.setup>,
  label: RegExp,
  value: string,
) => {
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.type(field, value);
};

describe("PayoutRecordDialog", () => {
  beforeEach(() => {
    record.mutateAsync.mockClear();
  });

  it("sends the courier's own figures, not a recomputed net", async () => {
    const user = await openDialog();
    await user.type(screen.getByLabelText(/statement reference/i), "SFC-26926554");
    await typeNumber(user, /collected \(gross\)/i, "810");
    await typeNumber(user, /^delivery$/i, "145");
    await typeNumber(user, /payment charge/i, "7");
    await typeNumber(user, /paid over \(net\)/i, "658");

    await user.click(screen.getByRole("button", { name: /record payout/i }));

    expect(record.mutateAsync).toHaveBeenCalledTimes(1);
    const sent = record.mutateAsync.mock.calls[0][0];
    expect(sent).toMatchObject({
      statementRef: "SFC-26926554",
      gross: 810,
      net: 658,
    });
    expect(sent.deductions).toMatchObject({ delivery: 145, paymentCharge: 7 });
  });

  it("says so when the statement does not add up, and still lets it be filed", async () => {
    const user = await openDialog();
    await user.type(screen.getByLabelText(/statement reference/i), "SFC-BAD");
    await typeNumber(user, /collected \(gross\)/i, "810");
    await typeNumber(user, /^delivery$/i, "145");
    // 810 − 145 is 665, not 700.
    await typeNumber(user, /paid over \(net\)/i, "700");

    expect(screen.getByText(/a difference of/i)).toBeInTheDocument();
    // Not blocked: the server refuses it with PAYOUT_UNRECONCILED, and a merchant who typed
    // what the paper says has found something worth sending.
    expect(screen.getByRole("button", { name: /record payout/i })).toBeEnabled();
  });

  it("will not file a statement with no reference or nothing collected", async () => {
    await openDialog();
    expect(screen.getByRole("button", { name: /record payout/i })).toBeDisabled();
  });
});
