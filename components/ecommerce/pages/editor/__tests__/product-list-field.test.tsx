// coding-standard: maintained
import { describe, expect, it, vi } from "vitest";
import { fireEvent, renderWithProviders, screen } from "@/tests/test-utils";

/**
 * A Manual product section's ordered list (docs/plan/storefront-product-order.md §8).
 * The storefront shows `productIds` in exactly the stored order, so every edit
 * here — add, move, remove — is an edit to what shoppers see.
 */

const OPTIONS = [
  { label: "Alpha", value: "a" },
  { label: "Bravo", value: "b" },
  { label: "Charlie", value: "c" },
  { label: "Delta", value: "d" },
];

vi.mock("@/services/api", () => ({
  useSelectOptions: () => ({ data: OPTIONS, isLoading: false, error: null }),
}));

// The real combobox is a Fuse popover; one button per option is enough to prove
// what a pick does with the list.
vi.mock("@/ui/components/fuse-advanced-select", () => ({
  FuseAdvancedSelect: ({
    onValueChange,
    disabled,
    placeholder,
  }: {
    onValueChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
  }) => (
    <div>
      <span>{placeholder}</span>
      {OPTIONS.map((option) => (
        <button key={option.value} type="button" disabled={disabled} onClick={() => onValueChange(option.value)}>
          pick {option.label}
        </button>
      ))}
    </div>
  ),
}));

const { ProductListField, moveItem } = await import("../product-list-field");

const renderField = (value: string[], max?: number) => {
  const onChange = vi.fn();
  renderWithProviders(
    <ProductListField id="products" optionsApi="/products?fields=_id,name" value={value} onChange={onChange} max={max} />,
  );
  return onChange;
};

const rowNames = () =>
  screen.getAllByRole("listitem").map((row) => row.textContent?.replace(/^\d+/, "").trim());

describe("ProductListField", () => {
  it("shows the products in their stored order", () => {
    renderField(["c", "a", "b"]);
    expect(rowNames()).toEqual(["Charlie", "Alpha", "Bravo"]);
  });

  it("adds a pick to the end and ignores one already in the list", () => {
    const onChange = renderField(["c", "a"]);

    fireEvent.click(screen.getByRole("button", { name: "pick Bravo" }));
    expect(onChange).toHaveBeenLastCalledWith(["c", "a", "b"]);

    onChange.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "pick Alpha" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("moves a product with the arrow keys on its handle", () => {
    const onChange = renderField(["a", "b", "c"]);

    fireEvent.keyDown(screen.getByRole("button", { name: /^Move Alpha/ }), { key: "ArrowDown" });
    expect(onChange).toHaveBeenLastCalledWith(["b", "a", "c"]);

    fireEvent.keyDown(screen.getByRole("button", { name: /^Move Charlie/ }), { key: "ArrowUp" });
    expect(onChange).toHaveBeenLastCalledWith(["a", "c", "b"]);
  });

  it("does not move the first product up or the last one down", () => {
    const onChange = renderField(["a", "b"]);

    fireEvent.keyDown(screen.getByRole("button", { name: /^Move Alpha/ }), { key: "ArrowUp" });
    fireEvent.keyDown(screen.getByRole("button", { name: /^Move Bravo/ }), { key: "ArrowDown" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("removes a product and keeps the rest in order", () => {
    const onChange = renderField(["a", "b", "c"]);

    fireEvent.click(screen.getByRole("button", { name: "Remove Bravo" }));

    expect(onChange).toHaveBeenLastCalledWith(["a", "c"]);
  });

  it("stops adding at the section's limit", () => {
    const onChange = renderField(["a", "b"], 2);

    expect(screen.getByText("All 2 places are filled")).toBeTruthy();
    expect(screen.getByRole("button", { name: "pick Charlie" })).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: "pick Charlie" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("names a product that no longer exists so it can be removed", () => {
    const onChange = renderField(["gone", "a"]);

    expect(rowNames()[0]).toBe("Product no longer available");
    fireEvent.click(screen.getByRole("button", { name: "Remove Product no longer available" }));
    expect(onChange).toHaveBeenLastCalledWith(["a"]);
  });
});

describe("moveItem", () => {
  it("moves with splice semantics, the index after removal", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(["a", "b", "c", "d"], 3, 0)).toEqual(["d", "a", "b", "c"]);
  });
});
