// coding-standard: maintained
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrderPaymentPanel } from "./order-payment-panel";

/**
 * The payment card's collection buttons (2026-10-10). "Mark COD collected" read as "the money is
 * in my hand" when the courier holds it, and on a shipped Pathao parcel it booked money before
 * anyone said the parcel arrived.
 */
vi.mock("@/services/api", () => ({ useMarkOrderPaid: () => ({ mutate: vi.fn(), isPending: false }) }));
vi.mock("@/hooks/use-order-account-options", () => ({
  useOrderAccountOptions: () => ({ accountsEnabled: false, options: [] }),
}));
vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { currency: "BDT" } } }),
}));
vi.mock("./order-collection-dialog", () => ({
  OrderCollectionDialog: ({ trigger }: { trigger: React.ReactNode }) => trigger,
}));
vi.mock("./order-prepayment-dialog", () => ({ OrderPrepaymentDialog: () => null }));

const order = (overrides: Record<string, unknown>) =>
  ({
    _id: "o1",
    saleId: "s1",
    totalAmount: 570,
    paymentMethod: "cod",
    paymentStatus: "pending",
    fulfillmentType: "delivery",
    status: "delivered",
    courier: { provider: "pathao", integration: "api" },
    ...overrides,
  }) as never;

describe("OrderPaymentPanel collection buttons", () => {
  it("says the courier collected it, not that the merchant has it", () => {
    render(<OrderPaymentPanel order={order({})} />);
    expect(screen.getByRole("button", { name: /^Courier collected ৳\s?570$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Courier collected less…" })).toBeInTheDocument();
    expect(screen.queryByText("Mark COD collected")).toBeNull();
  });

  it("waits for a connected courier to report a shipped parcel", () => {
    render(<OrderPaymentPanel order={order({ status: "shipped" })} />);
    expect(screen.queryByRole("button", { name: /courier collected/i })).toBeNull();
    expect(screen.getByText(/recorded automatically when the courier reports/i)).toBeInTheDocument();
  });

  it("keeps the buttons for a courier tracked by hand", () => {
    render(
      <OrderPaymentPanel
        order={order({ status: "shipped", courier: { name: "Local rider", integration: "manual" } })}
      />,
    );
    expect(screen.getAllByRole("button", { name: /^Courier collected/ })).toHaveLength(2);
  });
});
