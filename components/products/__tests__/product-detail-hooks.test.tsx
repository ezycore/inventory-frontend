// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ProductDetail } from "../product-detail";

/**
 * The loading → loaded transition, which is where a hooks-order violation hides.
 *
 * `useStockTracked()` sat below the `isLoading` and `not found` early returns,
 * among the module-gate booleans it reads like. So on the first render React
 * never reached it, and on the second it did:
 *
 *   "React has detected a change in the order of Hooks called by ProductDetail.
 *    This will lead to bugs and errors if not fixed."
 *
 * Every cold open of a product page threw it. The rule is not stylistic — React
 * matches hooks by call order, so the state of every hook after the new one
 * shifts by a slot.
 *
 * This test renders through the transition and fails on any console error, which
 * is how React reports the violation.
 */
const product = vi.hoisted(() => ({ current: undefined as unknown }));
const loading = vi.hoisted(() => ({ current: true }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: undefined }),
}));
vi.mock("@/services/api", () => ({
  useProduct: () => ({
    data: product.current,
    isLoading: loading.current,
    error: null,
  }),
  useProductBySlug: () => ({
    data: product.current,
    isLoading: loading.current,
    error: null,
  }),
  useProductAnalytics: () => ({ data: undefined }),
  useStockMovements: () => ({ data: undefined }),
}));
vi.mock("@/services/api/query-keys", () => ({
  queryKeys: { inventory: { byProduct: (id: string) => ["inventory", id] } },
}));
vi.mock("@/lib/currency", () => ({
  useCurrency: () => ({ format: (n: number) => `৳${n}` }),
}));
vi.mock("@/services/stores", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { features: {} } } }),
}));
// Deliberately implemented with a REAL hook. `useStockTracked` is a one-line
// wrapper around this store, so a mock that is a plain function registers no
// hook at all — and the test would pass even with the bug in place, because
// React would see no change in hook count between renders.
vi.mock("@/services/stores/use-auth-store", async () => {
  const { useMemo } = await import("react");
  return {
    useAuthStore: (selector: (s: unknown) => unknown) =>
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useMemo(() => selector({ user: { organization: { features: {} } } }), [selector]),
  };
});
// The detail sub-views are not what is under test; each would drag in its own
// query and chart stack.
vi.mock("../detail/detail-hero", () => ({
  DetailHero: () => <div data-testid="loaded" />,
}));
vi.mock("../detail/detail-stats", () => ({ DetailStats: () => <div /> }));
vi.mock("../detail/detail-charts", () => ({ DetailCharts: () => <div /> }));
vi.mock("../detail/detail-info-card", () => ({ DetailInfoCard: () => <div /> }));
vi.mock("../detail/detail-variants", () => ({ DetailVariants: () => <div /> }));
vi.mock("../detail/detail-activity", () => ({ DetailActivity: () => <div /> }));
vi.mock("../detail/detail-pricing", () => ({ DetailPricing: () => <div /> }));
vi.mock("../detail/detail-timeline", () => ({ DetailTimeline: () => <div /> }));
vi.mock("../detail/detail-storefront", () => ({
  DetailStorefront: () => <div />,
}));

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  loading.current = true;
  product.current = undefined;
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => errorSpy.mockRestore());

describe("ProductDetail hook order", () => {
  it("survives the loading → loaded transition without a hooks-order error", () => {
    const { rerender } = render(<ProductDetail productId="p1" />);

    loading.current = false;
    product.current = {
      _id: "p1",
      name: "Blend probe",
      price: 100,
      productType: "single",
    };
    rerender(<ProductDetail productId="p1" />);

    expect(screen.getByTestId("loaded")).toBeInTheDocument();
    const messages = errorSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(messages).not.toMatch(/order of Hooks/i);
  });
});
