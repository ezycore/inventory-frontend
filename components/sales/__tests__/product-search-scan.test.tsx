// coding-standard: maintained
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import salesMessages from "@/messages/en/sales.json";
import { ProductSearch } from "../product-search";
import type { ExtractedProduct } from "../types";

const product = (over: Partial<ExtractedProduct>): ExtractedProduct => ({
  value: "inv-1",
  label: "Surgical Gloves Sterile (Latex) - 7.5",
  price: 45,
  costPrice: 34,
  availableQuantity: 150,
  productId: "p-1",
  variantId: null,
  quantityAlert: 0,
  ...over,
});

const CATALOGUE = [
  product({ value: "inv-1", barcode: "8901234567890" }),
  product({ value: "inv-2", label: "Disposable Syringe - 5 ml", productId: "p-2", barcode: "8901234500001" }),
];

/** The clock keystrokes are timed by — a scanner types a few ms apart, a person 100+ ms. */
let now = 0;

/** The POS box by default; `scanner: false` is a shop with the barcode feature off. */
function setup({ scanner = true, openOnFocus = false }: { scanner?: boolean; openOnFocus?: boolean } = {}) {
  const onScan = vi.fn();
  const onSelect = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={{ sales: salesMessages }}>
      <QueryClientProvider client={new QueryClient()}>
        <ProductSearch
          onSelect={onSelect}
          onScan={scanner ? onScan : undefined}
          openOnFocus={openOnFocus}
          source={CATALOGUE}
          loading={false}
        />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
  return { onScan, onSelect, input: screen.getByRole("textbox") as HTMLInputElement };
}

/** Type `text` one key at a time, `gapMs` apart, then press Enter. */
function typeThenEnter(input: HTMLInputElement, text: string, gapMs: number) {
  fireEvent.focus(input);
  let value = "";
  for (const char of text) {
    now += gapMs;
    fireEvent.keyDown(input, { key: char });
    value += char;
    fireEvent.change(input, { target: { value } });
  }
  now += gapMs;
  fireEvent.keyDown(input, { key: "Enter" });
}

beforeEach(() => {
  now = 1_000;
  vi.spyOn(performance, "now").mockImplementation(() => now);
});
afterEach(() => vi.restoreAllMocks());

describe("ProductSearch — one box for scanning and searching", () => {
  it("treats a scanner burst as a barcode, not a pick from the list", () => {
    const { onScan, onSelect, input } = setup();
    typeThenEnter(input, "8901234567890", 5);

    expect(onScan).toHaveBeenCalledWith("8901234567890");
    expect(onSelect).not.toHaveBeenCalled();
    expect(input.value).toBe("");
  });

  it("reads Bangla digits from a scanner as a barcode (Avro/Bijoy left on)", () => {
    const { onScan, input } = setup();
    typeThenEnter(input, "৮৯০১২৩৪৫৬৭৮৯০", 5);

    expect(onScan).toHaveBeenCalledWith("8901234567890");
  });

  it("lets a person type a name and pick the first match with Enter", () => {
    const { onScan, onSelect, input } = setup();
    typeThenEnter(input, "syringe", 120);

    expect(onScan).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ value: "inv-2" }));
  });

  it("looks up a hand-typed code that matches no product", () => {
    const { onScan, onSelect, input } = setup();
    typeThenEnter(input, "4006381333931", 150);

    expect(onScan).toHaveBeenCalledWith("4006381333931");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("stays closed when the box is only focused (the counter focuses it on arrival)", () => {
    const { input } = setup();
    fireEvent.focus(input);

    expect(screen.queryByText("Disposable Syringe - 5 ml")).toBeNull();
  });

  it("stays closed on focus for a shop with the barcode feature off, too", () => {
    const { input } = setup({ scanner: false });
    fireEvent.focus(input);
    expect(screen.queryByText("Disposable Syringe - 5 ml")).toBeNull();

    fireEvent.change(input, { target: { value: "syr" } });
    expect(screen.getByText("Disposable Syringe - 5 ml")).toBeTruthy();
  });

  it("still lists everything on focus where the caller wants that (New Sale)", () => {
    const { input } = setup({ scanner: false, openOnFocus: true });
    fireEvent.focus(input);

    expect(screen.getByText("Disposable Syringe - 5 ml")).toBeTruthy();
  });

  it("lists only the exact product for a full barcode typed by hand", () => {
    const { input } = setup();
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "8901234500001" } });

    expect(screen.getByText("Disposable Syringe - 5 ml")).toBeTruthy();
    expect(screen.queryByText("Surgical Gloves Sterile (Latex) - 7.5")).toBeNull();
  });
});
