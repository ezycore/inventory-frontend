// coding-standard: maintained

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogProduct } from "@/lib/storefront-client";
import { useCardQuickBuy } from "@/components/storefront/use-card-quick-buy";

const mocks = vi.hoisted(() => ({
  addItem: vi.fn(),
  push: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
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
  useStorefrontUI: () => ({ t: { added: "Added", outOfStock: "Out of stock" } }),
}));
vi.mock("@/lib/storefront-toast", () => ({
  toast: { success: mocks.success, error: mocks.error },
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

/** The catalogue each test starts from; a test that needs another sets `mocks.detail`. */
const BASE_DETAIL = mocks.detail;

describe("useCardQuickBuy variant defaults", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.detail = BASE_DETAIL;
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

  it("defaults to the cheapest sellable variant, not the first listed", () => {
    mocks.detail = {
      variants: [
        {
          _id: "variant-large",
          label: "Large",
          attributes: { Size: "L" },
          price: 180,
          availableQuantity: 2,
          images: [],
        },
        {
          _id: "variant-small",
          label: "Small",
          attributes: { Size: "S" },
          price: 120,
          availableQuantity: 4,
          images: [],
        },
      ],
    };
    render(<Harness />);

    // The card headline prices off `chosen`, so a pricier first-in-list default
    // would raise the advertised "From" price with no shopper action at all.
    expect(screen.getByText("variant-small")).toBeInTheDocument();
  });

  it("says why, instead of going dead, when nothing in the row is sellable", () => {
    mocks.detail = {
      variants: [
        {
          _id: "variant-small",
          label: "Small",
          attributes: { Size: "S" },
          price: 120,
          availableQuantity: 0,
          images: [],
        },
        {
          _id: "variant-medium",
          label: "Medium",
          attributes: { Size: "M" },
          price: 140,
          availableQuantity: 0,
          images: [],
        },
      ],
    };
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(mocks.addItem).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledWith("Out of stock");
  });
});
