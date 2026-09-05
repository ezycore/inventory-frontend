// coding-standard: maintained

import { describe, expect, it } from "vitest";
import type { OrderStats } from "@/services/api";
import { getOrderStats } from "./helpers";

/**
 * The order-list stat cards.
 *
 * These exist because the row was quietly lying about money. "Collected today"
 * reported what the courier was *asked* for rather than what they handed over,
 * and there was no tile at all for the difference — so a day with ৳4,950 of
 * goods refused at the door looked identical to a day with none. The arithmetic
 * is the server's; what is asserted here is that the row shows the returns at
 * all, keeps the two kinds apart, and does not shout in alarm colours over a
 * zero.
 */
const stats = (over: Partial<OrderStats> = {}): OrderStats =>
  ({
    pending: { count: 0, value: 0 },
    confirmedProcessing: { count: 0, value: 0 },
    inTransitCod: { count: 2, value: 3720 },
    awaitingPickup: { count: 0, value: 0 },
    deliveredUncollected: { count: 0, value: 0 },
    collectedToday: { count: 3, value: 8280 },
    fullyReturnedToday: { count: 0, value: 0 },
    partlyReturnedToday: { count: 0, value: 0 },
    gatewayPaid: { count: 0, value: 0 },
    byCourier: [],
    byFulfillment: [{ type: "delivery", count: 7 }],
    byChannel: [],
    ...over,
  }) as OrderStats;

const tile = (data: ReturnType<typeof getOrderStats>, label: string) =>
  data.find((d) => d.label === label);

describe("getOrderStats", () => {
  it("shows both kinds of return, kept apart", () => {
    const data = getOrderStats(
      stats({
        fullyReturnedToday: { count: 1, value: 1860 },
        partlyReturnedToday: { count: 2, value: 4800 },
      }),
      "BDT",
    );

    // A full RTO and a sale that merely shrank are different problems with
    // different fixes, so they must never be summed into one "returns" tile.
    expect(tile(data, "Returned today")?.value).toBe("৳1,860");
    expect(tile(data, "Returned today")?.description).toBe("1 order");
    expect(tile(data, "Partly returned today")?.value).toBe("৳4,800");
    expect(tile(data, "Partly returned today")?.description).toBe("2 orders");
  });

  it("renders the return tiles even at zero", () => {
    const data = getOrderStats(stats(), "BDT");
    // "Nothing came back today" is real news on a COD business — unlike a
    // pickup tile on a delivery-only shop, which is a zero that means
    // "inapplicable" and is dropped below.
    expect(tile(data, "Returned today")?.value).toBe("৳0");
    expect(tile(data, "Partly returned today")?.value).toBe("৳0");
  });

  it("keeps alarm colours for tiles that actually hold money", () => {
    const quiet = getOrderStats(stats(), "BDT");
    expect(tile(quiet, "Delivered · uncollected")?.variant).toBe("default");
    expect(tile(quiet, "Returned today")?.variant).toBe("default");

    const loud = getOrderStats(
      stats({
        deliveredUncollected: { count: 1, value: 1860 },
        fullyReturnedToday: { count: 1, value: 1860 },
        partlyReturnedToday: { count: 1, value: 3000 },
      }),
      "BDT",
    );
    expect(tile(loud, "Delivered · uncollected")?.variant).toBe("danger");
    expect(tile(loud, "Returned today")?.variant).toBe("danger");
    expect(tile(loud, "Partly returned today")?.variant).toBe("warning");
  });

  it("drops the pickup tile for a store that never takes pickups", () => {
    expect(tile(getOrderStats(stats(), "BDT"), "Awaiting pickup")).toBeUndefined();
    expect(
      tile(
        getOrderStats(
          stats({
            byFulfillment: [
              { type: "delivery", count: 7 },
              { type: "pickup", count: 1 },
            ],
          }),
          "BDT",
        ),
        "Awaiting pickup",
      ),
    ).toBeDefined();
  });

  it("renders a full row of zeroes while the stats are still loading", () => {
    // `undefined` is the pre-fetch state, and the row must not throw on it —
    // `byFulfillment` is read for the pickup decision before any data exists.
    const data = getOrderStats(undefined, "BDT");
    expect(data.every((d) => d.value === "৳0")).toBe(true);
    expect(tile(data, "Awaiting pickup")).toBeUndefined();
  });
});
