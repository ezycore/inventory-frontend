// coding-standard: maintained
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/tests/test-utils";
import type { OrdersReportData } from "@/services/api/modules/reports/api";
import { OrderCourierCard } from "./order-segment-cards";

/**
 * The Orders Report's courier split, as a live UriiBaba month read it: "pathao" in lowercase, and
 * a "No courier" bucket of 39 never-dispatched orders printing a "+৳1,040" delivery margin on
 * parcels nobody had carried. The backend now counts sent parcels only, paid not printed.
 */
const row = (over: Record<string, unknown>) => ({
  provider: "pathao",
  name: null,
  orders: 1,
  delivered: 1,
  returned: 0,
  rtoRate: 0,
  parcels: 1,
  charged: 70,
  received: 70,
  cost: 100,
  margin: -30,
  ...over,
});

const data = (byCourier: unknown[]) => ({ byCourier }) as unknown as OrdersReportData;
const money = (n: number) => `৳${n}`;

describe("OrderCourierCard", () => {
  it("names the courier properly and shows what customers paid against the bill", () => {
    renderWithProviders(<OrderCourierCard data={data([row({})])} formatCurrency={money} />);

    expect(screen.getByText("Pathao")).toBeInTheDocument();
    expect(screen.queryByText("pathao")).not.toBeInTheDocument();
    expect(screen.getByText("৳-30")).toBeInTheDocument();
    expect(screen.getByText(/৳70 paid · ৳100 to the courier/)).toBeInTheDocument();
  });

  it("gives orders never sent no margin at all", () => {
    renderWithProviders(
      <OrderCourierCard
        data={data([row({ provider: null, parcels: 0, charged: 0, received: 0, cost: 0, margin: null })])}
        formatCurrency={money}
      />,
    );

    expect(screen.getByText("No parcels sent")).toBeInTheDocument();
    expect(screen.queryByText("Delivery margin")).not.toBeInTheDocument();
  });
});
