// coding-standard: maintained
import { renderWithProviders as render, screen } from "@/tests/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AdminStorefrontOrder } from "@/services/api";
import { OrderRow } from "./order-row";

vi.mock("@/hooks/use-org-calendar", () => ({ useOrgCalendar: () => ({ timezone: "Asia/Dhaka" }) }));
vi.mock("@/components/ecommerce/orders/order-row-actions", () => ({ OrderRowActions: () => null }));
vi.mock("@/components/ecommerce/orders/copy-track-link", () => ({ CopyTrackLink: () => null }));

const order = {
  _id: "o1",
  orderNumber: "ORD-1",
  status: "shipped",
  createdAt: "2026-10-10T06:00:00.000Z",
  items: [{ quantity: 1 }],
  totalAmount: 570,
  paymentMethod: "cod",
  paymentStatus: "pending",
  shippingAddress: { name: "Rubel", phone: "01311189668" },
} as unknown as AdminStorefrontOrder;

const renderRow = (onOpen = vi.fn(), onShowBuyer = vi.fn()) => {
  render(
    <table>
      <tbody>
        <OrderRow
          order={order}
          checked={false}
          statusLabel="Shipped"
          buyerHistory={{ orders: 4, rejected: 0, returned: 2 }}
          now={new Date("2026-10-12T06:00:00.000Z")}
          onToggle={vi.fn()}
          onOpen={onOpen}
          onShowBuyer={onShowBuyer}
        />
      </tbody>
    </table>,
  );
  return { onOpen, onShowBuyer };
};

describe("OrderRow buyer chip", () => {
  it("filters to the buyer's orders instead of opening this one", async () => {
    const { onOpen, onShowBuyer } = renderRow();
    await userEvent.click(screen.getByRole("button", { name: "4 orders · 2 returned" }));
    expect(onShowBuyer).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
