// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DetailCharts } from "../detail/detail-charts";

/**
 * G9 (backend `docs/features/business-modes.md`): a shop that does not count stock saw three
 * stock charts on every product, each reading "No data yet". They go; the sales figures stay —
 * and a product sold only with no cost shows no profit figure rather than ৳0.
 */
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/hooks/use-movement-reason-label", () => ({ useMovementReasonLabel: () => (r: string) => r }));
vi.mock("@ui/components/charts", () => ({
  AreaChart: ({ title }: { title: string }) => <div>{title}</div>,
  BarChart: ({ title }: { title: string }) => <div>{title}</div>,
  DonutChart: ({ title }: { title: string }) => <div>{title}</div>,
}));

const analytics = {
  stock: { totalQuantity: 0, stockValue: 0, locationCount: 1, lowStockLocations: 0, byLocation: [] },
  sales: { unitsSold: 3, revenue: 2700, cogs: 0, grossProfit: 0, unknownRevenue: 2700, margin: null, orderCount: 3 },
  movement: { stockIn: { count: 0, quantity: 0 }, stockOut: { count: 0, quantity: 0 }, netChange: 0, reasonBreakdown: [] },
  trend: [],
  byVariant: [],
} as never;

const renderCharts = (stockTracked: boolean) =>
  render(
    <DetailCharts
      analytics={analytics}
      salesEnabled
      stockTracked={stockTracked}
      formatCurrency={(n) => `৳${n}`}
    />,
  );

describe("product page charts (G9)", () => {
  it("draws no stock charts for a business that does not count stock", () => {
    renderCharts(false);
    expect(screen.queryByText("movementTitle")).toBeNull();
    expect(screen.queryByText("locationTitle")).toBeNull();
    expect(screen.getByText("৳2700")).toBeInTheDocument();
  });

  it("keeps them where stock is counted", () => {
    renderCharts(true);
    expect(screen.getByText("movementTitle")).toBeInTheDocument();
  });

  it("shows no profit figure when no sale had a cost", () => {
    renderCharts(false);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("৳0")).toBeNull();
  });
});
