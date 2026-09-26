// coding-standard: maintained

import { describe, expect, it } from "vitest";

import type { CourierParcel, CourierPayout } from "@/services/api";
import {
  autoTick,
  courierParams,
  expectedFor,
  payoutCharges,
  payoutShortfall,
} from "./helpers";

/**
 * The payment form's starting ticks (backend `courier-settlement-manual.md` §4.3 D): open
 * parcels oldest first, ticked until their owed sum covers what arrived. A returned parcel's
 * negative owed is ticked in its turn — the courier deducts its charge from the same payment.
 */
const parcel = (orderId: string, owed: number): CourierParcel =>
  ({ orderId, owed }) as unknown as CourierParcel;

const parcels = [
  parcel("a", 510),
  parcel("b", -60),
  parcel("c", 510),
  parcel("d", 510),
];

describe("autoTick", () => {
  it("ticks oldest first until the owed sum covers the amount", () => {
    expect(autoTick(parcels, 960)).toEqual(["a", "b", "c"]);
  });

  it("ticks every parcel when the amount covers them all", () => {
    expect(autoTick(parcels, 1470)).toEqual(["a", "b", "c", "d"]);
  });

  it("ticks nothing for a zero amount", () => {
    expect(autoTick(parcels, 0)).toEqual([]);
  });
});

describe("expectedFor", () => {
  it("nets the ticked parcels only, returned ones included", () => {
    expect(expectedFor(parcels, ["a", "b"])).toBe(450);
  });
});

describe("courierParams", () => {
  it("sends a provider or a custom courier, never the card's key", () => {
    expect(courierParams({ provider: "pathao" })).toEqual({
      provider: "pathao",
    });
    expect(courierParams({ customCourierId: "x1" })).toEqual({
      customCourierId: "x1",
    });
    expect(courierParams({})).toEqual({});
  });
});

describe("payoutShortfall / payoutCharges", () => {
  const payout = (fields: Partial<CourierPayout>) =>
    ({ reconciled: true, residual: 0, ...fields }) as CourierPayout;

  it("counts extra courier charges with the statement's deductions", () => {
    expect(
      payoutCharges(
        payout({ deductions: { delivery: 60 }, extraCharges: 10 } as never),
      ),
    ).toBe(70);
  });

  it("an open shortfall is unreconciled", () => {
    expect(
      payoutShortfall(
        payout({ reconciled: false, residual: 10, residualSettled: 4 }),
      ),
    ).toEqual({
      open: 6,
      badge: "Unreconciled",
    });
  });

  it("a shortfall a later payment covered reads as recovered", () => {
    expect(
      payoutShortfall(
        payout({ reconciled: false, residual: 10, residualSettled: 10 }),
      ),
    ).toEqual({
      open: 0,
      badge: "Recovered",
    });
  });

  it("a shortfall given up on reads as written off", () => {
    expect(
      payoutShortfall(
        payout({
          reconciled: false,
          residual: 5,
          residualSettled: 5,
          residualWrittenOff: 5,
        }),
      ),
    ).toEqual({ open: 0, badge: "Written off" });
  });

  it("an over-payment is still unreconciled — nothing to settle", () => {
    expect(payoutShortfall(payout({ reconciled: false, residual: 0 }))).toEqual(
      {
        open: 0,
        badge: "Unreconciled",
      },
    );
  });
});
