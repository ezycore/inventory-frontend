// coding-standard: maintained

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogProduct } from "@/lib/storefront-client";
import { useCardQuickBuy } from "@/components/storefront/use-card-quick-buy";

const mocks = vi.hoisted(() => ({
  addItem: vi.fn(),
  push: vi.fn(),
  success: vi.fn(),
  detail: {
    variants: [
      {
        _id: "variant-small",
        label: "Small",
        attributes: { Size: "S" },
        price: 120,
        availableQuantity: 4,
        images: [],
      },
      {
        _id: "variant-medium",
        label: "Medium",
        attributes: { Size: "M" },
        price: 140,
        availableQuantity: 3,
        images: [],
      },
    ],
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));
vi.mock("@/services/stores/use-cart-store", () => ({
  useCartStore: (select: (state: { addItem: typeof mocks.addItem }) => unknown) =>
    select({ addItem: mocks.addItem }),
}));
vi.mock("@/services/storefront/hooks", () => ({
  useStoreProduct: () => ({ data: mocks.detail, isFetching: false }),
}));
vi.mock("@/services/storefront/store-context", () => ({
  useStoreContext: () => ({ slug: "test-store", base: "/shop" }),
}));
vi.mock("@/services/storefront/ui-context", () => ({
  useStorefrontUI: () => ({ t: { added: "Added" } }),
}));
vi.mock("@/lib/storefront-toast", () => ({
  toast: { success: mocks.success },
}));

const product = {
  _id: "product-1",
  slug: "shirt",
  name: "Shirt",
  price: 100,
  images: [],
  hasVariants: true,
  availableQuantity: 7,
} as unknown as CatalogProduct;

function Harness() {
  const qb = useCardQuickBuy(product);
  return (
    <>
      <button type="button" onClick={() => qb.press("add")}>Add</button>
      <button type="button" onClick={() => qb.pick({ Size: "M" })}>Pick medium</button>
      <output>{qb.chosen?._id ?? "none"}</output>
    </>
  );
}

describe("useCardQuickBuy variant defaults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("commits the highlighted sellable default without a redundant chip click", () => {
    render(<Harness />);

    expect(screen.getByText("variant-small")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(mocks.addItem).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(mocks.addItem).toHaveBeenCalledWith(
      "test-store",
      expect.objectContaining({
        productId: "product-1",
        variantId: "variant-small",
        variantLabel: "Small",
        price: 120,
      }),
      1,
    );
  });

  it("commits an explicitly selected replacement variant", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "Pick medium" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(mocks.addItem).toHaveBeenCalledWith(
      "test-store",
      expect.objectContaining({
        variantId: "variant-medium",
        variantLabel: "Medium",
        price: 140,
      }),
      1,
    );
  });
});
