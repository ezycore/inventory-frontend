// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { OrderRowActions } from "./order-row-actions";

/**
 * The row's action menu.
 *
 * What is asserted here is **what the merchant is offered**, not what happens
 * when they take it — the mutations and every precondition behind them are the
 * server's, and tested there. The failure mode on this side is quieter than an
 * exception: offer Delete on an order the server will refuse and the merchant
 * learns to distrust the menu; hide Confirm on a pending one and the feature
 * silently does not exist for them.
 *
 * Two of these cover a gate that has real consequences: `storefront.orders.delete`
 * is admin-only precisely because `manager` and `staff` hold
 * `storefront.orders.manage`, so a menu that read the wrong permission would put
 * permanent deletion in front of every fulfillment staffer.
 */
const confirmMutate = vi.hoisted(() => vi.fn());
const deleteMutate = vi.hoisted(() => vi.fn());
const permissions = vi.hoisted(() => ({ value: [] as string[] }));

vi.mock("@/services/api", () => ({
  useConfirmOrder: () => ({ mutate: confirmMutate }),
  useDeleteOrder: () => ({ mutate: deleteMutate }),
}));
vi.mock("@/hooks/use-stock-tracked", () => ({ useStockTracked: () => true }));
vi.mock("@/hooks/use-has-permission", () => ({
  PERMISSIONS: { storefrontOrdersDelete: "storefront.orders.delete" },
  useHasPermission: (p: string) => permissions.value.includes(p),
}));
// The reject path is `OrderCancelDialog`'s own; it has its own tests, and its
// real implementation drags in the auth store and the accounts hook.
vi.mock("./order-cancel-dialog", () => ({
  OrderCancelDialog: ({ open }: { open?: boolean }) =>
    open ? <div>cancel dialog</div> : null,
}));

const order = (over: Record<string, unknown> = {}) =>
  ({
    _id: "o1",
    orderNumber: "ORD-20260908-00001",
    status: "pending",
    paymentStatus: "pending",
    paymentMethod: "cod",
    fulfillmentType: "delivery",
    totalAmount: 560,
    items: [{ productId: "p1", productName: "Panjabi", quantity: 2, price: 250 }],
    ...over,
  }) as never;

const openMenu = async (over: Record<string, unknown> = {}, onOpen = vi.fn()) => {
  const user = userEvent.setup();
  render(<OrderRowActions order={order(over)} onOpen={onOpen} />);
  await user.click(screen.getByRole("button", { name: /actions for/i }));
  return { user, onOpen };
};

const item = (name: RegExp) => screen.queryByRole("menuitem", { name });

beforeEach(() => {
  confirmMutate.mockReset();
  deleteMutate.mockReset();
  permissions.value = [];
});

describe("order row actions", () => {
  describe("what the menu offers", () => {
    it("offers confirm and reject on a pending order", async () => {
      await openMenu();

      expect(item(/view details/i)).toBeTruthy();
      expect(item(/confirm order/i)).toBeTruthy();
      expect(item(/reject/i)).toBeTruthy();
    });

    it("offers only view details once the order has moved on", async () => {
      await openMenu({ status: "shipped" });

      expect(item(/view details/i)).toBeTruthy();
      expect(item(/confirm order/i)).toBeNull();
      expect(item(/reject/i)).toBeNull();
    });

    it("opens the order from the menu", async () => {
      const { user, onOpen } = await openMenu();
      await user.click(screen.getByRole("menuitem", { name: /view details/i }));

      expect(onOpen).toHaveBeenCalledOnce();
    });
  });

  describe("confirm", () => {
    it("asks before confirming, and names what it will do", async () => {
      const { user } = await openMenu();
      await user.click(screen.getByRole("menuitem", { name: /confirm order/i }));

      // The stock-tracked wording — the item count is the merchant's check that
      // they picked the row they meant.
      expect(screen.getByText(/reserves stock for 2 items/i)).toBeTruthy();
      expect(confirmMutate).not.toHaveBeenCalled();

      await user.click(
        screen.getByRole("button", { name: /confirm & reserve stock/i }),
      );
      expect(confirmMutate).toHaveBeenCalledWith("o1");
    });
  });

  describe("delete", () => {
    it("is absent without the permission, even on a rejected order", async () => {
      // `manager` and `staff` hold `storefront.orders.manage` and reach this menu
      // — permanent deletion must not come with it.
      await openMenu({ status: "rejected" });

      expect(item(/delete permanently/i)).toBeNull();
    });

    it("is offered on a rejected order to someone who may delete", async () => {
      permissions.value = ["storefront.orders.delete"];
      await openMenu({ status: "rejected" });

      expect(item(/delete permanently/i)).toBeTruthy();
    });

    it("is absent on a live order even with the permission", async () => {
      permissions.value = ["storefront.orders.delete"];
      await openMenu({ status: "pending" });

      expect(item(/delete permanently/i)).toBeNull();
    });

    it("is absent on a closed order the server would refuse", async () => {
      // The menu shows what will work. A prepayment the merchant kept on a
      // cancelled order is the case that looks deletable and is not.
      permissions.value = ["storefront.orders.delete"];
      await openMenu({ status: "cancelled", prepaidAmount: 200 });

      expect(item(/delete permanently/i)).toBeNull();
    });

    it("is absent on an order handed to a manual courier", async () => {
      permissions.value = ["storefront.orders.delete"];
      await openMenu({ status: "rejected", courier: { name: "Rider bhai" } });

      expect(item(/delete permanently/i)).toBeNull();
    });

    it("asks before deleting, and says the record is not wholly lost", async () => {
      permissions.value = ["storefront.orders.delete"];
      const { user } = await openMenu({ status: "rejected" });
      await user.click(
        screen.getByRole("menuitem", { name: /delete permanently/i }),
      );

      expect(
        screen.getByText(/ORD-20260908-00001 permanently\?/i),
      ).toBeTruthy();
      // The tombstone is the reason this is safe to offer at all, so the dialog
      // has to say so — otherwise the merchant is choosing between "keep the
      // junk" and "lose the answer to a customer dispute".
      expect(screen.getByText(/record of the order number/i)).toBeTruthy();
      expect(deleteMutate).not.toHaveBeenCalled();

      await user.click(
        screen.getByRole("button", { name: /^delete permanently$/i }),
      );
      expect(deleteMutate).toHaveBeenCalledWith("o1");
    });
  });
});
