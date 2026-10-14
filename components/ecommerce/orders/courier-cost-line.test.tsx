// coding-standard: maintained
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/tests/test-utils";
import type { AdminStorefrontOrder } from "@/services/api";
import { CourierCostLine } from "./order-line-items";

const money = (n: number) => `৳${n}`;
const order = (over: Record<string, unknown>) =>
  ({ shippingCharged: 70, shippingCost: 60, ...over }) as unknown as AdminStorefrontOrder;

describe("CourierCostLine", () => {
  it("before the courier bills, says the cost is an estimate", () => {
    // Live: "Courier cost (your expense) ৳60 · shipping margin ৳60" on a Moulvibazar order.
    renderWithProviders(<CourierCostLine order={order({})} money={money} />);
    expect(screen.getByText(/Estimated courier cost ৳60/)).toBeInTheDocument();
  });

  it("a parcel that came back: margin is minus the whole bill, not fee minus bill", () => {
    renderWithProviders(
      <CourierCostLine
        order={order({
          courier: { consignmentId: "P-1", deliveryReceived: 0, charges: { actual: { totalFee: 100 } } },
        })}
        money={money}
      />,
    );
    expect(screen.getByText(/delivery margin ৳-100/)).toBeInTheDocument();
    expect(screen.getByText(/customer paid ৳0 for delivery/)).toBeInTheDocument();
  });

  it("handed over in person: no courier cost to estimate (shadow test S16)", () => {
    renderWithProviders(
      <CourierCostLine order={order({ handedOverAt: "2026-10-14T06:00:43.138Z", shippingCost: 0 })} money={money} />,
    );
    expect(screen.getByText("Handed over in person — no courier, no courier charge.")).toBeInTheDocument();
    expect(screen.queryByText(/Estimated courier cost/)).not.toBeInTheDocument();
  });

  it("a delivered parcel: fee minus bill, no extra note", () => {
    renderWithProviders(
      <CourierCostLine
        order={order({
          courier: { consignmentId: "P-2", deliveryReceived: 70, charges: { actual: { totalFee: 55 } } },
        })}
        money={money}
      />,
    );
    expect(screen.getByText("Courier charged ৳55 · delivery margin ৳15")).toBeInTheDocument();
  });
});
