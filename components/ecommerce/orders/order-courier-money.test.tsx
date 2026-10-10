// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrderCourierMoney } from "./order-courier-money";
import type { AdminStorefrontOrder } from "@/services/api";

/**
 * The order page's courier-money panel.
 *
 * It exists because the page could show neither of the two things that made COD margin a
 * fiction: the delivery cost was the dispatch quote (no COD fee in it at all), and collected
 * cash was booked as cash days before the courier handed it over.
 *
 * Three rules it must hold to:
 *
 * - **`supported: false` is an answer.** Steadfast publishes no charge anywhere, so a parcel
 *   with no actual figure says the quote still stands — it never shows an invented number.
 * - **Absent is not zero.** A courier that itemises no COD fee has not said it was free, so
 *   the row is dropped rather than printed as 0.
 * - **`not_collected` says nothing.** The payment panel already covers an uncollected order.
 */
const auth = vi.hoisted(() => ({
  state: {
    user: {
      organization: {
        currency: "BDT",
        timezone: "Asia/Dhaka",
        features: { accounts: true } as Record<string, boolean>,
      },
    },
  },
}));

vi.mock("@/services/stores/use-auth-store", () => {
  const state = auth.state;
  // A selector hook that also answers `getState()`, which `getOrgTimezone` reads.
  const useAuthStore = (selector: (s: unknown) => unknown) => selector(state);
  return { useAuthStore: Object.assign(useAuthStore, { getState: () => state }) };
});

vi.mock("@/hooks/use-has-permission", () => ({
  useHasPermission: () => true,
  PERMISSIONS: {},
}));

const refresh = vi.hoisted(() => ({ mutate: vi.fn(), isPending: false }));

vi.mock("@/services/api", () => ({
  useRefreshCourierCharges: () => refresh,
}));

const order = (courier: Record<string, unknown>) =>
  ({ _id: "order-1", courier }) as unknown as AdminStorefrontOrder;

describe("OrderCourierMoney", () => {
  beforeEach(() => {
    auth.state.user.organization.features = { accounts: true };
  });

  // business-modes D2 / G2: a merchant who records no courier payments must not be told a
  // courier owes them — the parcel would read "owed" forever.
  it("says nothing about what the courier owes when Accounts is off", () => {
    auth.state.user.organization.features = { accounts: false };
    render(
      <OrderCourierMoney
        order={order({
          provider: "steadfast",
          integration: "api",
          remittance: { status: "with_courier", clearingAmount: 570 },
        })}
      />,
    );
    expect(screen.queryByText(/collected by Steadfast/)).not.toBeInTheDocument();
  });

  it("shows the courier's real bill against the quote, and the gap", () => {
    render(
      <OrderCourierMoney
        order={order({
          provider: "pathao",
          integration: "api",
          charges: {
            quoted: 70,
            actual: { deliveryFee: 150, codFee: 36.35, totalFee: 186.35, weightKg: 6 },
            source: "api",
          },
        })}
      />,
    );
    expect(screen.getByText("Quoted at dispatch")).toBeInTheDocument();
    expect(screen.getByText("৳186.35")).toBeInTheDocument();
    expect(screen.getByText("COD fee")).toBeInTheDocument();
    // The live case: ৳116.35 more than quoted, which is the whole margin story.
    expect(screen.getByText(/৳116.35 more than quoted/)).toBeInTheDocument();
  });

  it("says the quote stands when the courier publishes no charge", () => {
    render(
      <OrderCourierMoney
        order={order({
          provider: "steadfast",
          integration: "api",
          charges: { quoted: 60, source: "quote" },
        })}
      />,
    );
    expect(
      screen.getByText(/has not published a charge for this parcel/i),
    ).toBeInTheDocument();
    // No invented total, and no zero pretending to be one.
    expect(screen.queryByText("Actually billed")).not.toBeInTheDocument();
    expect(screen.queryByText("COD fee")).not.toBeInTheDocument();
  });

  it("says the courier owes a settled delivery's COD, less their charge", () => {
    render(
      <OrderCourierMoney
        order={order({
          provider: "steadfast",
          integration: "api",
          remittance: { status: "with_courier", clearingAmount: 570 },
        })}
      />,
    );
    expect(screen.getByText(/collected by Steadfast/)).toBeInTheDocument();
    expect(screen.getByText("৳570")).toBeInTheDocument();
  });

  it("says a returned parcel's charge comes out of a payment", () => {
    render(
      <OrderCourierMoney
        order={order({
          provider: "steadfast",
          integration: "api",
          charges: { actual: { deliveryFee: 60, totalFee: 60 }, source: "webhook" },
          remittance: { status: "with_courier", clearingAmount: 0 },
        })}
      />,
    );
    expect(screen.getByText(/will take its charge \(৳60\)/)).toBeInTheDocument();
  });

  it("flags a partial delivery for the merchant to resolve", () => {
    render(
      <OrderCourierMoney
        order={
          {
            _id: "order-1",
            paymentStatus: "pending",
            courier: {
              provider: "pathao",
              integration: "api",
              remittance: { status: "not_collected", partialDelivery: true },
            },
          } as unknown as AdminStorefrontOrder
        }
      />,
    );
    expect(screen.getByText(/reported a partial delivery/)).toBeInTheDocument();
  });

  // Live ORD-20260923-00005: paid in full at ৳1,870, Pathao collected ৳935, and the
  // "Courier says returned" queue told the merchant to Return whole order.
  it("flags a partial delivery that was already paid, with what the courier collected", () => {
    render(
      <OrderCourierMoney
        order={
          {
            _id: "order-1",
            status: "delivered",
            paymentStatus: "paid",
            courier: {
              provider: "pathao",
              integration: "api",
              partialDelivery: true,
              collectedAmount: 935,
            },
          } as unknown as AdminStorefrontOrder
        }
      />,
    );
    expect(screen.getByText(/reported a partial delivery and collected ৳935/)).toBeInTheDocument();
    expect(screen.getByText("Return items")).toBeInTheDocument();
  });

  // Live ORD-20261004-00014 (Steadfast `partial_delivered`, amount 520 → 70) and
  // ORD-20261002-00015 (Pathao "Paid Return", ৳120): refused, delivery charge paid.
  it("says a refused parcel was paid for at the door, not that items were kept", () => {
    render(
      <OrderCourierMoney
        order={
          {
            _id: "order-1",
            status: "delivered",
            paymentStatus: "pending",
            courier: {
              provider: "steadfast",
              name: "Steadfast",
              integration: "api",
              paidReturn: true,
              collectedAmount: 70,
              remittance: { status: "with_courier", partialDelivery: true },
            },
          } as unknown as AdminStorefrontOrder
        }
      />,
    );
    expect(
      screen.getByText(/refused the parcel but paid ৳\s?70 at the door\. Steadfast holds it/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/reported a partial delivery/)).toBeNull();
  });

  it("stops flagging once the refused items are recorded", () => {
    render(
      <OrderCourierMoney
        order={
          {
            _id: "order-1",
            status: "partially_returned",
            paymentStatus: "paid",
            courier: { provider: "pathao", integration: "api", partialDelivery: true },
          } as unknown as AdminStorefrontOrder
        }
      />,
    );
    expect(screen.queryByText(/reported a partial delivery/)).toBeNull();
  });

  it("says a payment covered it, without the retired payout reference", () => {
    render(
      <OrderCourierMoney
        order={order({
          provider: "steadfast",
          integration: "api",
          remittance: {
            status: "remitted",
            payoutRef: "SFC-26926554",
            remittedAt: "2026-09-10T00:00:00.000Z",
          },
        })}
      />,
    );
    expect(screen.getByText(/Covered by a payment from Steadfast/)).toBeInTheDocument();
    expect(screen.queryByText(/SFC-26926554/)).not.toBeInTheDocument();
  });

  it("renders nothing for a parcel with no courier money at all", () => {
    const { container } = render(
      <OrderCourierMoney
        order={order({ provider: "steadfast", integration: "api" })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("says nothing about remittance before anything is collected", () => {
    render(
      <OrderCourierMoney
        order={order({
          provider: "steadfast",
          integration: "api",
          charges: { quoted: 60, source: "quote" },
          remittance: { status: "not_collected" },
        })}
      />,
    );
    expect(screen.queryByText(/collected by Steadfast/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Covered by a payment/)).not.toBeInTheDocument();
  });
});
