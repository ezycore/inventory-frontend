// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReceiveItemsDialog } from "./receive-items-dialog";

/**
 * Receiving goods against a purchase order.
 *
 * The defect this pins down (QA-R16): the Paid Amount field was prefilled with
 * the ENTIRE outstanding invoice regardless of how much of the order had turned
 * up. Receiving 4 of 10 — ৳6,000 of goods against a ৳15,000 order — still
 * offered ৳15,000, so a merchant clicking through paid the supplier for six
 * units that were never on the van.
 */
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
// Hoisted so the hook returns a STABLE reference: a fresh array each render
// re-runs the dialog's init effect forever, which hangs the test rather than
// failing it.
const accounts = vi.hoisted(() => [
  { _id: "acc-1", name: "Cash", isDefault: true },
]);
vi.mock("@/services/api", () => ({
  useAccountPaymentOptions: () => ({ data: accounts }),
}));
vi.mock("@/services/stores", () => ({
  useAuthStore: () => ({
    user: {
      organization: { features: { accounts: true, expiryTracking: false } },
    },
  }),
}));

/** ৳15,000 order: 10 units at ৳1,500, nothing received or paid yet. */
const order = {
  _id: "po-1",
  orderNumber: "PO-0001",
  dueAmount: 15000,
  totalAmount: 15000,
  items: [
    {
      productId: "p1",
      productName: "Cotton pant",
      quantity: 10,
      receivedQuantity: 0,
      price: 1500,
      costPrice: 1500,
      subtotal: 15000,
    },
  ],
} as never;

const renderDialog = () =>
  render(
    <ReceiveItemsDialog
      open
      onOpenChange={vi.fn()}
      order={order}
      formatCurrency={(n) => `৳${n}`}
      isPending={false}
      onSubmit={vi.fn()}
    />,
  );

const paidField = () => screen.getByLabelText(/paidAmount/i);
const qtyField = () => screen.getByLabelText(/colReceiveQty — Cotton pant/i);

describe("receive items dialog — paid amount", () => {
  it("offers the full due when the whole order is arriving", async () => {
    renderDialog();
    // Unchanged for the common case: a full receipt is still one click.
    expect(paidField()).toHaveValue("15000");
  });

  it("stops offering the full invoice once the receipt is partial", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.clear(qtyField());
    await user.type(qtyField(), "4");

    // Cleared rather than recomputed: a line's payable share depends on per-line
    // tax and the order's allocated discount, and re-deriving that money in the
    // browser is how the two ends drift apart.
    expect(paidField()).toHaveValue("");
    expect(screen.getByText("partialReceiptPayHint")).toBeInTheDocument();
  });

  it("never overwrites an amount the merchant typed themselves", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.clear(paidField());
    await user.type(paidField(), "6000");
    await user.clear(qtyField());
    await user.type(qtyField(), "4");

    expect(paidField()).toHaveValue("6000");
  });
});
