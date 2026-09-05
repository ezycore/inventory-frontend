// coding-standard: maintained

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { OrderCollectionDialog } from "./order-collection-dialog";

/**
 * The collection dialog — P4 of the COD-collection plan.
 *
 * Its job is not to compute money; the server re-derives every figure and
 * refuses a request that does not reconcile. Its job is to make the merchant
 * ACCOUNT for the gap before they can submit, because the two ways of not doing
 * that are exactly the bugs this feature exists to remove: marking paid in full
 * fabricates cash that never arrived, and recording the short amount alone
 * leaves a phantom receivable against a customer who settled and went home.
 *
 * So these tests are about the submit button, not the arithmetic.
 */
const record = vi.hoisted(() => ({ mutateAsync: vi.fn(), isPending: false }));
vi.mock("@/services/api", () => ({ useRecordCollection: () => record }));
vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { currency: "BDT" } } }),
}));
vi.mock("@/hooks/use-order-account-options", () => ({
  useOrderAccountOptions: () => ({ accountsEnabled: false, options: [] }),
}));
vi.mock("@/hooks/use-stock-tracked", () => ({ useStockTracked: () => true }));

/** A ৳500 + ৳400 + ৳300 order with ৳60 delivery — the merchant's own example. */
const order = {
  _id: "order-1",
  totalAmount: 1260,
  paymentMethod: "cod",
  items: [
    { productId: "a", productName: "Item A", quantity: 1, price: 500, subtotal: 500 },
    { productId: "b", productName: "Item B", quantity: 1, price: 400, subtotal: 400 },
    { productId: "c", productName: "Item C", quantity: 1, price: 300, subtotal: 300 },
  ],
} as never;

const openDialog = async (overrides: Record<string, unknown> = {}) => {
  const user = userEvent.setup();
  render(
    <OrderCollectionDialog
      order={{ ...(order as object), ...overrides } as never}
      trigger={<button>Open</button>}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Open" }));
  return user;
};

const submitButton = () =>
  screen.getByRole("button", { name: /record collection/i });
const setNumber = async (user: ReturnType<typeof userEvent.setup>, label: RegExp | string, value: string) => {
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.type(field, value);
};

beforeEach(() => record.mutateAsync.mockReset());

describe("collection dialog", () => {
  it("submits a full collection with nothing to explain", async () => {
    const user = await openDialog();
    // Defaults to the expected amount — a collection that matches in full stays
    // one click, which is why this sits beside "Mark COD collected" rather than
    // replacing it.
    await user.click(submitButton());

    await waitFor(() => expect(record.mutateAsync).toHaveBeenCalledTimes(1));
    expect(record.mutateAsync.mock.calls[0][0]).toMatchObject({
      id: "order-1",
      collected: 1260,
    });
  });

  it("refuses to submit while the difference is unaccounted for", async () => {
    // The whole point of the dialog. ৳960 against a ৳1,260 order with no reason
    // given is the merchant about to invent ৳300 one way or the other.
    const user = await openDialog();
    await setNumber(user, /collected/i, "960");

    expect(submitButton()).toBeDisabled();
    expect(screen.getByText(/unaccounted/i)).toBeInTheDocument();
  });

  it("re-enables once the returned goods explain the gap", async () => {
    const user = await openDialog();
    await setNumber(user, /collected/i, "960");
    await setNumber(user, /return item c/i, "1");

    await waitFor(() => expect(submitButton()).toBeEnabled());
    await user.click(submitButton());

    await waitFor(() => expect(record.mutateAsync).toHaveBeenCalled());
    expect(record.mutateAsync.mock.calls[0][0]).toMatchObject({
      collected: 960,
      returnLines: [{ productId: "c", variantId: null, quantity: 1 }],
    });
  });

  it("demands a reason for a discount before it will submit", async () => {
    const user = await openDialog();
    await setNumber(user, /collected/i, "1150");
    await setNumber(user, /discount given/i, "110");

    // Reconciles arithmetically, and still refuses: a concession with no reason
    // is an unexplained hole in the margin six months later.
    expect(submitButton()).toBeDisabled();
    expect(screen.getByText(/a reason is required/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/why the discount/i), "Negotiated at the door");
    await waitFor(() => expect(submitButton()).toBeEnabled());
  });

  it("sends a return and a discount together", async () => {
    // Both happen on the same doorstep, which is why the reasons are amounts
    // that sum rather than a radio group.
    const user = await openDialog();
    await setNumber(user, /collected/i, "910");
    await setNumber(user, /return item c/i, "1");
    await setNumber(user, /discount given/i, "50");
    await user.type(screen.getByLabelText(/why the discount/i), "saved the sale");

    await waitFor(() => expect(submitButton()).toBeEnabled());
    await user.click(submitButton());

    await waitFor(() => expect(record.mutateAsync).toHaveBeenCalled());
    expect(record.mutateAsync.mock.calls[0][0]).toMatchObject({
      collected: 910,
      returnLines: [{ productId: "c", variantId: null, quantity: 1 }],
      discount: { amount: 50, note: "saved the sale" },
    });
  });

  it("mints a fresh idempotency key per submission", async () => {
    // A retry after a timeout and a second genuine collection are the same
    // request; only the client can tell them apart, so the key is minted here.
    const user = await openDialog();
    await user.click(submitButton());
    await waitFor(() => expect(record.mutateAsync).toHaveBeenCalled());
    expect(record.mutateAsync.mock.calls[0][0].idempotencyKey).toBeTruthy();
  });

  it("accepts an amount deliberately left owing", async () => {
    const user = await openDialog();
    await setNumber(user, /collected/i, "1150");
    await setNumber(user, /still owed/i, "110");

    await waitFor(() => expect(submitButton()).toBeEnabled());
    await user.click(submitButton());
    await waitFor(() => expect(record.mutateAsync).toHaveBeenCalled());
    expect(record.mutateAsync.mock.calls[0][0]).toMatchObject({ stillOwed: 110 });
  });

  /**
   * An advance is not money the courier can hand over — its shipping leg is
   * already banked and its goods leg already settled part of the Sale. Reading
   * the order total here made every honest collection on a prepaid order look
   * short by exactly what the shopper had already paid, and the merchant could
   * only get past it by inventing a reason for a gap that was not there.
   */
  it("expects the order total net of a prepayment", async () => {
    await openDialog({ prepaidAmount: 150 });

    // 1,260 invoiced − 150 already paid. The field opens on it, so a collection
    // that matches in full is still one click.
    expect(screen.getByLabelText(/collected/i)).toHaveValue("1110");
    // And the subtraction is shown, not merely applied: the merchant is holding a
    // ৳1,260 invoice and has to recognise the figure in front of them.
    expect(screen.getByText(/already prepaid/i)).toBeInTheDocument();
    expect(screen.getByText("−৳150")).toBeInTheDocument();
    expect(screen.getByText("৳1,260")).toBeInTheDocument();
  });

  it("submits the COD amount, not the order total, when part is prepaid", async () => {
    const user = await openDialog({ prepaidAmount: 150 });
    await user.click(submitButton());

    await waitFor(() => expect(record.mutateAsync).toHaveBeenCalled());
    expect(record.mutateAsync.mock.calls[0][0]).toMatchObject({ collected: 1110 });
  });
});
