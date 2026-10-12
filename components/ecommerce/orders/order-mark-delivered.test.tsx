// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminStorefrontOrder } from "@/services/api";
import { OrderMarkDelivered } from "./order-mark-delivered";

/**
 * Live, UriiBaba ORD-20260911-00001: marked delivered by hand three days after Pathao handed
 * the parcel back. Delivered over the courier's "returned" now asks first (backend
 * `COURIER_SAYS_RETURNED`).
 */
const mutate = vi.hoisted(() => vi.fn());
vi.mock("@/services/api", () => ({ useUpdateOrderStatus: () => ({ mutate, isPending: false }) }));

const order = (courier: Record<string, unknown>) =>
  ({ _id: "o1", status: "shipped", courier }) as unknown as AdminStorefrontOrder;

beforeEach(() => mutate.mockReset());

describe("OrderMarkDelivered", () => {
  it("delivers straight away when the courier agrees", async () => {
    render(
      <OrderMarkDelivered
        order={order({ provider: "pathao", integration: "api", normalizedStatus: "in_transit" })}
        label="Mark as Delivered"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Mark as Delivered" }));
    expect(mutate).toHaveBeenCalledWith({ id: "o1", status: "delivered", confirmCourierReturned: undefined });
  });

  it("asks first when the courier says the parcel came back, and confirms on the second press", async () => {
    render(
      <OrderMarkDelivered
        order={order({ provider: "pathao", name: "pathao", integration: "api", normalizedStatus: "returned" })}
        label="Mark as Delivered"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Mark as Delivered" }));
    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByText("Pathao says this parcel came back")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Mark delivered anyway" }));
    expect(mutate).toHaveBeenCalledWith({ id: "o1", status: "delivered", confirmCourierReturned: true });
  });

  it("never asks for a manual courier — the merchant is the tracking source there", async () => {
    render(
      <OrderMarkDelivered
        order={order({ name: "Rider Co", integration: "manual", normalizedStatus: "returned" })}
        label="Mark as Delivered"
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Mark as Delivered" }));
    expect(mutate).toHaveBeenCalledTimes(1);
  });
});
