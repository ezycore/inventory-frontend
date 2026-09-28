// coding-standard: maintained

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CourierBalances } from "@/services/api";
import { CourierBalanceCards } from "./courier-balance-cards";

/** "Courier owes you" — one card per courier, the server's figures, never re-derived. */
vi.mock("@/services/stores/use-auth-store", () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { organization: { currency: "BDT" } } }),
}));
vi.mock("./payment-record-dialog", () => ({
  PaymentRecordDialog: ({ trigger }: { trigger: React.ReactNode }) => trigger,
}));
vi.mock("./shortfall-write-off-dialog", () => ({
  ShortfallWriteOffDialog: () => <button>Write off shortfall</button>,
}));

const data = {
  summary: { couriers: 2, parcels: 3, owed: 990 },
  couriers: [
    {
      courierKey: "pathao",
      label: "Pathao",
      provider: "pathao",
      parcels: 2,
      collected: 1140,
      charges: 180,
      shortfall: 30,
      owed: 990,
      oldestDays: 9,
    },
    {
      courierKey: "steadfast",
      label: "Steadfast",
      provider: "steadfast",
      parcels: 1,
      collected: 0,
      charges: 60,
      shortfall: 0,
      owed: -60,
      oldestDays: 1,
    },
  ],
  parcels: [],
} as unknown as CourierBalances;

describe("CourierBalanceCards", () => {
  it("shows what each courier owes, and says so when the merchant owes the courier", () => {
    render(<CourierBalanceCards data={data} canManage />);
    expect(screen.getByText("৳990")).toBeInTheDocument();
    expect(screen.getByText(/you owe the courier/)).toBeInTheDocument();
    expect(screen.getByText("oldest 9 d")).toBeInTheDocument();
    expect(screen.getByText("Short from earlier payments")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: "Record payment received" }),
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: "Write off shortfall" }),
    ).toHaveLength(1);
  });

  it("hides the write actions from a read-only role", () => {
    render(<CourierBalanceCards data={data} canManage={false} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("says plainly when nothing is open", () => {
    render(<CourierBalanceCards data={undefined} canManage />);
    expect(
      screen.getByText(/Nothing open with any courier/),
    ).toBeInTheDocument();
  });
});
