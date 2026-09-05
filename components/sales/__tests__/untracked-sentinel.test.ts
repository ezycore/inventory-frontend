// coding-standard: maintained
/**
 * The sentinel must never reach a merchant's eyes.
 *
 * `UNTRACKED_AVAILABLE_QUANTITY` is `Number.MAX_SAFE_INTEGER`, chosen so every
 * `availableQuantity > 0` test downstream keeps working unchanged on a
 * stock-free workspace. That trade is deliberate and it holds — for the tests.
 * It does not hold for the handful of places that PRINT the figure, which is why
 * the backend sends `tracked: false` alongside it and the DTO's own docstring
 * says anything displaying the number must read that first.
 *
 * The flag is only useful if it survives the trip. It is mapped three times
 * between the API and the sell line — `productItemsCreateCallback`,
 * `extractProductValue`, and the store's own line shape — and dropping it at any
 * one of them puts "9007199254740991 in stock" under every product in the
 * picker. That is exactly what shipped: the picker had been EMPTY before the
 * sentinel was wired, so the number had never had anywhere to show.
 */
import { describe, it, expect } from "vitest";
import { productItemsCreateCallback, extractProductValue } from "../helpers";

/** The value `utils/stock-tracking.ts` sends for an untracked workspace. */
const SENTINEL = Number.MAX_SAFE_INTEGER;

const apiRow = (over: Record<string, unknown> = {}) => ({
  _id: "inv1",
  name: "Panjabi",
  price: 900,
  costPrice: 400,
  quantity: SENTINEL,
  tracked: false,
  productId: "p1",
  variantId: null,
  unitName: "pc",
  saleUnitName: null,
  taxRate: 0,
  taxType: "inclusive",
  ...over,
});

describe("untracked sentinel plumbing", () => {
  it("carries `tracked` from the API row onto the picker option", () => {
    const [option] = productItemsCreateCallback({
      data: [apiRow()],
    } as never) as any[];

    expect(option.availableQuantity).toBe(SENTINEL);
    // Without this the picker has the sentinel and no way to know it is one.
    expect(option.tracked).toBe(false);
  });

  it("carries `tracked` on through the form-value extraction", () => {
    const extracted = extractProductValue({
      value: "inv1",
      label: "Panjabi",
      price: 900,
      costPrice: 400,
      availableQuantity: SENTINEL,
      tracked: false,
      productId: "p1",
      variantId: null,
    }) as any;

    expect(extracted.tracked).toBe(false);
  });

  it("leaves a tracked workspace's rows alone", () => {
    // Absent and `true` must both read as "this is a real count" — the display
    // guards test `!== false` precisely so an older payload without the field
    // keeps showing its number.
    const [withFlag] = productItemsCreateCallback({
      data: [apiRow({ quantity: 7, tracked: true })],
    } as never) as any[];
    expect(withFlag.tracked).toBe(true);
    expect(withFlag.availableQuantity).toBe(7);

    const row = apiRow({ quantity: 7 });
    delete (row as Record<string, unknown>).tracked;
    const [without] = productItemsCreateCallback({ data: [row] } as never) as any[];
    expect(without.tracked).toBeUndefined();
    expect(without.availableQuantity).toBe(7);
  });
});
