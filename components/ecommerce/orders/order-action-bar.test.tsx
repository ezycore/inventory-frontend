// coding-standard: maintained
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OrderActionBar } from "./order-action-bar";

/**
 * One **Return items** button whatever the payment state (2026-10-10). A merchant asked why one
 * refused item meant pressing Mark as Delivered first: on an unpaid order the button was missing,
 * and the step that could do it hid in the payment card as "Collected a different amount…".
 */
const mutation = { mutate: vi.fn(), isPending: false };
vi.mock("@/services/api", () => ({
  useConfirmOrder: () => mutation,
  useMarkOrderPaid: () => mutation,
  useUpdateOrderStatus: () => mutation,
}));
vi.mock("@/hooks/use-order-account-options", () => ({
  useOrderAccountOptions: () => ({ accountsEnabled: false, options: [] }),
}));
vi.mock("@/hooks/use-stock-tracked", () => ({ useStockTracked: () => false }));
vi.mock("@/hooks/use-order-status-labels", () => ({
  useOrderStatusLabels: () => ({ labelFor: (s: string) => s }),
}));
vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { currency: "BDT" } } }),
}));
vi.mock("./order-edit-button", () => ({ OrderEditButton: () => null }));
vi.mock("./order-reverse-status-dialog", () => ({ OrderReverseStatusDialog: () => null }));
vi.mock("./order-cancel-dialog", () => ({ OrderCancelDialog: () => null }));
vi.mock("./order-confirm-dialog", () => ({ OrderConfirmDialog: () => null }));
vi.mock("./order-return-dialog", () => ({ OrderReturnDialog: () => <span>whole-order</span> }));
vi.mock("./order-collection-dialog", () => ({
  OrderCollectionDialog: ({ mode, trigger }: { mode?: string; trigger: React.ReactNode }) => (
    <span data-dialog={`collection:${mode}`}>{trigger}</span>
  ),
}));
vi.mock("./order-items-return-dialog", () => ({
  OrderItemsReturnDialog: ({ trigger }: { trigger: React.ReactNode }) => (
    <span data-dialog="items">{trigger}</span>
  ),
}));

const order = (overrides: Record<string, unknown>) =>
  ({
    _id: "o1",
    saleId: "s1",
    totalAmount: 570,
    paymentMethod: "cod",
    fulfillmentType: "delivery",
    items: [{ quantity: 1 }],
    courier: { provider: "pathao", integration: "api", consignmentId: "DU1" },
    ...overrides,
  }) as never;

const returnItemsDialog = () =>
  screen.getByRole("button", { name: "Return items" }).closest("[data-dialog]")?.getAttribute("data-dialog");

describe("OrderActionBar — Return items", () => {
  it("is offered on a shipped, unpaid order — no Mark as Delivered first", () => {
    render(<OrderActionBar order={order({ status: "shipped", paymentStatus: "pending" })} />);
    expect(returnItemsDialog()).toBe("collection:returnItems");
  });

  it("records the collection with it while the order is unpaid", () => {
    render(<OrderActionBar order={order({ status: "delivered", paymentStatus: "pending" })} />);
    expect(returnItemsDialog()).toBe("collection:returnItems");
  });

  it("takes a return after a paid delivery", () => {
    render(<OrderActionBar order={order({ status: "delivered", paymentStatus: "paid" })} />);
    expect(returnItemsDialog()).toBe("items");
  });

  it("is not offered before the parcel left", () => {
    render(<OrderActionBar order={order({ status: "processing", paymentStatus: "pending" })} />);
    expect(screen.queryByRole("button", { name: "Return items" })).toBeNull();
  });
});

describe("OrderActionBar — Confirm", () => {
  // No stock tracked here (the mock): nothing is held, so Confirm needs no prompt.
  it("confirms in one click on a shop that does not track stock", async () => {
    mutation.mutate.mockClear();
    render(<OrderActionBar order={order({ status: "pending", paymentStatus: "pending" })} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Confirm order" }));
    expect(mutation.mutate).toHaveBeenCalledWith("o1");
  });
});

