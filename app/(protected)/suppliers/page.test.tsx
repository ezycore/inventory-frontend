// coding-standard: maintained

import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * "Who do I owe, and pay them" from the Suppliers page — the twin of the
 * customers' dues flow. The totals link to the list filtered to suppliers owed;
 * a supplier's Due cell carries Pay, which opens their ledger (a supplier is
 * paid per purchase order, each with its own Pay there). The table, totals and
 * sheet are stubbed — what is under test is the page's wiring of them.
 */

const auth = {
  permissions: ["suppliers.view", "purchases.edit"] as string[],
  features: { accounts: true } as Record<string, boolean>,
};

vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: () => ({
    user: {
      permissions: auth.permissions,
      organization: { currency: "BDT", features: auth.features },
    },
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/use-filters", () => ({
  useFilteredFormConfig: (config: unknown) => config,
}));

vi.mock("@/services/api", () => ({
  suppliersApi: {},
  useCreateSupplier: () => ({}),
  useUpdateSupplier: () => ({}),
  useDeleteSupplier: () => ({}),
  useSupplierTotals: () => ({
    data: { payable: 900, creditorCount: 2, creditBalance: 0 },
    isLoading: false,
  }),
}));

const statCards = vi.fn();
vi.mock("@/ui/components/StatsCard", () => ({
  default: (props: { data: { label: string; href?: string }[] }) => {
    statCards(props.data);
    return null;
  },
}));

vi.mock("@/ui/components/dataTable", () => ({
  DataTable: () => null,
}));

type ColumnModes = {
  tracksMoney: boolean;
  onPay?: (row: { _id: string }) => void;
};
const columnModes = vi.fn();
const sheet = vi.fn();
vi.mock("@/components/suppliers", () => ({
  SupplierLedgerSheet: (props: { open: boolean; supplier: unknown }) => {
    sheet(props);
    return null;
  },
  getSupplierColumns: (_t: unknown, modes: ColumnModes) => {
    columnModes(modes);
    return [];
  },
  getSupplierFilterConfig: () => ({ fields: [] }),
  getSupplierFormConfig: () => ({}),
  supplierDefaultValues: {},
}));

import SuppliersPage from "./page";

const lastModes = () => columnModes.mock.calls.at(-1)?.[0] as ColumnModes;

describe("Suppliers page — dues", () => {
  beforeEach(() => {
    auth.permissions = ["suppliers.view", "purchases.edit"];
    auth.features = { accounts: true };
    statCards.mockClear();
    columnModes.mockClear();
    sheet.mockClear();
  });

  it("links the payable and supplier-count totals to the suppliers owed", () => {
    render(<SuppliersPage />);
    const cards = statCards.mock.calls.at(-1)?.[0] as {
      label: string;
      href?: string;
    }[];
    expect(cards.map((c) => [c.label, c.href])).toEqual([
      ["page.totals.payable", "/suppliers?hasDues=true"],
      ["page.totals.creditors", "/suppliers?hasDues=true"],
      ["page.totals.credit", undefined],
    ]);
  });

  it("Pay in the Due cell opens that supplier's ledger", () => {
    render(<SuppliersPage />);
    expect(lastModes().tracksMoney).toBe(true);
    act(() => lastModes().onPay?.({ _id: "sup-1" }));
    expect(sheet.mock.calls.at(-1)?.[0]).toMatchObject({
      open: true,
      supplier: { _id: "sup-1" },
    });
  });

  it("offers no Pay to a role that cannot pay purchases", () => {
    auth.permissions = ["suppliers.view"];
    render(<SuppliersPage />);
    expect(lastModes().onPay).toBeUndefined();
  });

  it("with Cash & Bank off: no totals, no Due column, no Pay", () => {
    auth.features = { accounts: false };
    render(<SuppliersPage />);
    expect(statCards).not.toHaveBeenCalled();
    expect(lastModes()).toMatchObject({ tracksMoney: false, onPay: undefined });
  });
});
