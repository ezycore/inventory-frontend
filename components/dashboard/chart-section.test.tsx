import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/tests/test-utils";
import type { DashboardOverview } from "@/services/api";
import { ChartSection } from "./chart-section";

/**
 * The chart's title must name exactly the lines it draws. It used to read "no
 * counter" as "storefront-only" and say Orders, so a shop with POS and the
 * storefront off and purchasing on got its purchases line under "Orders".
 */
const overview = {
  chartData: [{ label: "10:00", sales: 100, orders: 50, purchases: 80 }],
  period: { chartGrouping: "hourly" },
} as unknown as DashboardOverview;

const render = (lines: { sales?: boolean; orders?: boolean; purchases?: boolean }) =>
  renderWithProviders(
    <ChartSection
      overview={overview}
      isLoading={false}
      formatCurrency={(v) => String(v)}
      showSales={!!lines.sales}
      showOrders={!!lines.orders}
      showPurchases={!!lines.purchases}
    />,
  );

describe("ChartSection title", () => {
  it.each([
    [{ sales: true, purchases: true }, "Sales vs Purchases"],
    [{ sales: true, orders: true, purchases: true }, "Sales vs Purchases"],
    [{ sales: true }, "Sales"],
    [{ sales: true, orders: true }, "Sales & orders"],
    [{ orders: true }, "Orders"],
    [{ orders: true, purchases: true }, "Orders vs Purchases"],
    // The reported case: POS and storefront off, purchasing on.
    [{ purchases: true }, "Purchases"],
  ])("%o → %s", (lines, title) => {
    render(lines);
    expect(screen.getByText(title, { exact: true })).toBeInTheDocument();
  });

  it("never calls a purchases-only chart Orders", () => {
    render({ purchases: true });
    expect(screen.queryByText("Orders", { exact: true })).not.toBeInTheDocument();
  });

  it("renders nothing when it has no line to draw", () => {
    const { container } = render({});
    expect(container).toBeEmptyDOMElement();
  });
});
