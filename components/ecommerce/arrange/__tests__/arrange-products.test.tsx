// coding-standard: maintained
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, renderWithProviders, screen } from "@/tests/test-utils";
import type { ProductOrderRow, ProductOrderView } from "@/services/api";

/**
 * The Arrange screen (inventory-backend `docs/plan/storefront-product-order.md` §7):
 * what Save sends, what a role without `storefront.manage` can do, and the
 * default-sort warning (Q3).
 */

const row = (id: string, extra: Partial<ProductOrderRow> = {}): ProductOrderRow => ({
  _id: id,
  name: id.toUpperCase(),
  imageUrl: null,
  price: 100,
  featured: false,
  purchasable: true,
  ...extra,
});

let view: ProductOrderView;
let canManage = true;
let defaultSort: string | undefined;
const save = vi.fn();
const reset = vi.fn();

vi.mock("@/services/api", () => ({
  useProductOrder: () => ({ data: view, isLoading: false }),
  useSaveProductOrder: () => ({ mutate: save, isPending: false }),
  useResetProductOrder: () => ({ mutate: reset, isPending: false }),
}));
vi.mock("@/hooks/use-has-permission", () => ({ useHasPermission: () => canManage }));
vi.mock("@/components/ecommerce/use-live-store-settings", () => ({
  useLiveStoreSettings: () => ({
    data: { nav: { filters: defaultSort ? { sort: { default: defaultSort } } : undefined } },
  }),
}));

const { ArrangeProducts } = await import("../arrange-products");

const renderScreen = () =>
  renderWithProviders(
    <ArrangeProducts target={{ scope: "all" }} title="All products" backHref="/ecommerce/collections" backLabel="Collections" />,
  );

beforeEach(() => {
  view = { placed: [], unplaced: [], hasCustomOrder: false, truncated: false };
  canManage = true;
  defaultSort = undefined;
  save.mockClear();
  reset.mockClear();
});

describe("ArrangeProducts", () => {
  it("starts from the current order and saves it as the merchant's", () => {
    view = { ...view, unplaced: [row("a"), row("b")] };
    renderScreen();

    expect(screen.getByRole("button", { name: "Save" })).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: "Start from the current order" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(save).toHaveBeenCalledWith(["a", "b"], expect.anything());
  });

  it("places a product at the top and moves one with the arrow keys", () => {
    view = { ...view, placed: [row("a"), row("b")], unplaced: [row("z")], hasCustomOrder: true };
    renderScreen();

    fireEvent.click(screen.getByRole("button", { name: "Add to top" }));
    fireEvent.keyDown(screen.getByRole("button", { name: /^Move A/ }), { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(save).toHaveBeenCalledWith(["z", "b", "a"], expect.anything());
  });

  it("discards back to the saved order", () => {
    view = { ...view, placed: [row("a"), row("b")], hasCustomOrder: true };
    renderScreen();

    fireEvent.keyDown(screen.getByRole("button", { name: /^Move A/ }), { key: "ArrowDown" });
    expect(screen.getByText("Unsaved changes")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(screen.queryByText("Unsaved changes")).toBeNull();
    expect(screen.getByRole("button", { name: "Save" })).toHaveProperty("disabled", true);
  });

  it("explains a sold-out product's place", () => {
    view = { ...view, placed: [row("a", { purchasable: false })], hasCustomOrder: true };
    renderScreen();
    expect(screen.getByText("Out of stock · shows at the bottom")).toBeTruthy();
  });

  it("shows a role without storefront.manage the order but no way to change it", () => {
    canManage = false;
    view = { ...view, placed: [row("a")], unplaced: [row("b")], hasCustomOrder: true };
    renderScreen();

    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add to top" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Move A/ })).toBeNull();
  });

  it("warns when the store opens on another sort, and not when it opens on Featured", () => {
    defaultSort = "newest";
    const { unmount } = renderScreen();
    expect(screen.getByText(/shoppers only see this order when/)).toBeTruthy();
    unmount();

    defaultSort = "featured";
    renderScreen();
    expect(screen.queryByText(/shoppers only see this order when/)).toBeNull();
  });

  it("finds a product by name and stops dragging while searching", () => {
    view = { ...view, placed: [row("a", { name: "Blue Panjabi" }), row("b", { name: "Red Saree" })], hasCustomOrder: true };
    renderScreen();

    fireEvent.change(screen.getByRole("textbox", { name: "Find a product" }), { target: { value: "saree" } });

    expect(screen.queryByText("Blue Panjabi")).toBeNull();
    expect(screen.getByText("Red Saree")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Move Red Saree/ })).toBeNull();
  });
});
