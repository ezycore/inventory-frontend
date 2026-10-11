// coding-standard: maintained
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import { renderWithProviders, screen } from "@/tests/test-utils";
import type { ProductCostRow } from "@/types/api";
import { costsToSave, filterCostRows } from "./cost-prices-helpers";

const mutateAsync = vi.fn().mockResolvedValue({ data: { updated: 2, failed: [] } });
vi.mock("@/services/api", () => ({
  useSetProductCosts: () => ({ mutateAsync, isPending: false }),
}));

import { CostPricesEditor } from "./cost-prices-editor";

const row = (over: Partial<ProductCostRow>): ProductCostRow =>
  ({
    productId: "p1",
    variantId: null,
    productName: "Floor Mat - Money Dog",
    variantName: null,
    categoryId: "mats",
    categoryName: "Floormat",
    status: "active",
    price: 450,
    costPrice: 0,
    ...over,
  }) as ProductCostRow;

const rows = [
  row({}),
  row({ productId: "p2", productName: "Floor Mat - Red Car" }),
  row({ productId: "p3", productName: "Cushion - Cool Jerry", categoryId: "cush", categoryName: "Cushion", price: 599, costPrice: 280 }),
];

describe("cost prices helpers", () => {
  it("saves only changed rows, and never a cleared box as ৳0", () => {
    expect(
      costsToSave(rows, { "p1:": 220, "p2:": null, "p3:": 280 }),
    ).toEqual([{ productId: "p1", variantId: null, costPrice: 220 }]);
  });

  it("filters by category, missing cost and search", () => {
    expect(filterCostRows(rows, { search: "", categoryId: "mats", onlyMissing: false })).toHaveLength(2);
    expect(filterCostRows(rows, { search: "", categoryId: null, onlyMissing: true })).toHaveLength(2);
    expect(filterCostRows(rows, { search: "jerry", categoryId: null, onlyMissing: false })).toHaveLength(1);
  });
});

describe("CostPricesEditor", () => {
  it("sets every shown product at once and saves just those", async () => {
    // Live, UriiBaba: 0 of 443 products costed — two numbers (mats, cushions) should do it.
    renderWithProviders(<CostPricesEditor rows={rows} readOnly={false} money={(n) => `৳${n}`} />);
    expect(screen.getByText("2 of 3 products have no cost yet")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch"));
    const fill = screen.getByLabelText("Set the cost of all 2 shown products to");
    await userEvent.type(fill, "220");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    await userEvent.click(screen.getByRole("button", { name: "Save 2 changes" }));

    expect(mutateAsync).toHaveBeenCalledWith([
      { productId: "p1", variantId: null, costPrice: 220 },
      { productId: "p2", variantId: null, costPrice: 220 },
    ]);
  });

  it("is read-only where purchases own the cost", () => {
    renderWithProviders(<CostPricesEditor rows={rows} readOnly money={(n) => `৳${n}`} />);
    expect(screen.queryByRole("button", { name: /Save/ })).not.toBeInTheDocument();
    expect(screen.getByText(/come from your purchases/)).toBeInTheDocument();
    expect(screen.getByText("৳280")).toBeInTheDocument();
  });
});
