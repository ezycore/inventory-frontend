// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Sales History does not offer a counter sale the merchant cannot make.
 *
 * History stays readable when `sales` is off — that is what `readOnly` on the
 * nav item buys, and a year of sales must not vanish with the capability. The
 * **New Sale** button was the part the flag never covered: it pushes to
 * `/sales`, which `RouteAccessGuard` blocks, so an online-only merchant clicked
 * it and hit the access screen.
 *
 * The twin page `/purchases/history` was given exactly this guard, with a
 * comment citing QA-L6, and this one was missed (QA-R23). That is the failure
 * mode worth a test: two pages of the same shape, one fixed.
 */

const features = { current: {} as Record<string, boolean> };

vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { features: features.current } } }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/sales/history", () => ({
  useSalesHistoryPage: () => ({
    sales: [],
    columns: [],
    summary: undefined,
    isLoading: false,
    isSummaryLoading: false,
    isAccountsEnabled: true,
    formatCurrency: (n: number) => String(n),
    filterConfig: [],
    customActions: [],
    paginationInfo: undefined,
    page: 1,
    limit: 10,
    setPage: vi.fn(),
    setLimit: vi.fn(),
    drawerOpen: false,
    setDrawerOpen: vi.fn(),
    selectedSale: null,
    payments: [],
    isLoadingPayments: false,
    accounts: [],
    paymentAmount: 0,
    setPaymentAmount: vi.fn(),
    paymentAccountId: "",
    setPaymentAccountId: vi.fn(),
    paymentNotes: "",
    setPaymentNotes: vi.fn(),
    useCreditBalance: false,
    setUseCreditBalance: vi.fn(),
    isSubmittingPayment: false,
    handleMakePayment: vi.fn(),
    handlePaymentSubmit: vi.fn(),
    drawerRef: { current: null },
    saleReturns: [],
    isLoadingReturns: false,
    transactions: [],
    isLoadingTransactions: false,
    handleNavigateToSale: vi.fn(),
    drawerMode: "view",
  }),
  SummaryCards: () => null,
  PaymentsDrawer: () => null,
}));

vi.mock("@/ui/components/dataTable/base-data-table ", () => ({
  BaseDataTable: () => <div data-testid="table" />,
}));

import SalesHistoryPage from "./page";

const newSale = () => screen.queryByRole("button", { name: /newSale/i });

beforeEach(() => {
  features.current = {};
});

describe("sales history — New Sale", () => {
  it("offers New Sale when the counter is on", () => {
    features.current = { sales: true };
    render(<SalesHistoryPage />);

    expect(newSale()).toBeInTheDocument();
  });

  it("hides New Sale when the counter is off", () => {
    // The online-only merchant. History still renders — losing the capability
    // must never put the records out of reach.
    features.current = { sales: false };
    render(<SalesHistoryPage />);

    expect(newSale()).not.toBeInTheDocument();
    expect(screen.getByTestId("table")).toBeInTheDocument();
  });

  it("hides New Sale when the flag is absent entirely", () => {
    // An org whose feature map has not loaded is not an org that may sell at
    // the counter — the same direction `isFeatureEnabled` takes everywhere.
    render(<SalesHistoryPage />);

    expect(newSale()).not.toBeInTheDocument();
  });
});
