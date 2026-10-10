// coding-standard: maintained

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DetailPricing } from "../detail/detail-pricing";
import { canHandEditCost } from "@/lib/feature-utils";

/**
 * G4 (backend `docs/features/business-modes.md` §2.2): the cost price on the product page.
 *
 * Cost could only be typed once, inside opening stock on the create form, so a storefront shop
 * that skipped it had no way back — and the page then printed the whole selling price as
 * "Profit/Unit". The card must say there is no cost, offer to add one where the merchant owns the
 * cost, and say purchases own it where they do.
 */
const perms = vi.hoisted(() => ({ granted: new Set(["costs.view", "products.edit"]) }));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/hooks/use-has-permission", () => ({
  PERMISSIONS: { costsView: "costs.view", productsEdit: "products.edit" },
  useHasPermission: (p: string) => perms.granted.has(p),
}));
const mutate = vi.hoisted(() => vi.fn().mockResolvedValue({}));
vi.mock("@/services/api", () => ({
  useSetProductCost: () => ({ mutateAsync: mutate, isPending: false }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const renderCard = (props: Partial<Parameters<typeof DetailPricing>[0]> = {}) =>
  render(
    <DetailPricing
      product={{ _id: "p1", productType: "single" }}
      sellingPrice={900}
      costPrice={0}
      profitPerUnit={null}
      costHandEditable
      salesTaxRate={0}
      purchaseTaxRate={0}
      salesTaxActive={false}
      purchaseTaxActive={false}
      formatCurrency={(n) => `৳${n}`}
      {...props}
    />,
  );

describe("cost price on the product page (G4)", () => {
  beforeEach(() => {
    perms.granted = new Set(["costs.view", "products.edit"]);
    mutate.mockClear();
  });

  it("says there is no cost instead of printing ৳0, and no profit instead of the price", () => {
    renderCard();
    expect(screen.getByText("noCost")).toBeTruthy();
    expect(screen.queryByText("৳0")).toBeNull();
    expect(screen.queryByText("৳900", { selector: "span.font-medium" })).toBeNull();
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("saves a cost for the variant in view", async () => {
    renderCard({ product: { _id: "p1", productType: "variable" }, variantId: "v2" });
    fireEvent.click(screen.getByText("addCost"));
    fireEvent.change(screen.getByLabelText("label"), { target: { value: "400" } });
    fireEvent.blur(screen.getByLabelText("label"));
    fireEvent.click(screen.getByText("save"));
    await vi.waitFor(() =>
      expect(mutate).toHaveBeenCalledWith({ id: "p1", variantId: "v2", costPrice: 400 }),
    );
  });

  it("offers no edit where purchases own the cost, and says so", () => {
    renderCard({ costPrice: 350, profitPerUnit: 550, costHandEditable: false });
    expect(screen.queryByText("editCost")).toBeNull();
    expect(screen.getByText("costFromPurchases")).toBeTruthy();
  });

  it("offers no edit without the permission to edit products", () => {
    perms.granted = new Set(["costs.view"]);
    renderCard();
    expect(screen.queryByText("addCost")).toBeNull();
  });

  it("offers no edit on a combo", () => {
    renderCard({ product: { _id: "p1", productType: "combo" } });
    expect(screen.queryByText("addCost")).toBeNull();
  });
});

describe("canHandEditCost — mirrors the backend's costOwnedByPurchases", () => {
  it("is yes unless stock and purchases are both on", () => {
    expect(canHandEditCost({ inventoryTracking: false, purchases: false } as never)).toBe(true);
    expect(canHandEditCost({ inventoryTracking: true, purchases: false } as never)).toBe(true);
    expect(canHandEditCost({ inventoryTracking: true, purchases: true } as never)).toBe(false);
    // A map without the keys means both on — the backend's rule.
    expect(canHandEditCost({} as never)).toBe(false);
  });

  it("is no before the feature map loads, so no button flashes on", () => {
    expect(canHandEditCost(undefined)).toBe(false);
  });
});
