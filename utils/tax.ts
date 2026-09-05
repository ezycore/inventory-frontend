/**
 * Tax Calculation Utility
 *
 * Preview-only math for the sell flow. The backend is the source of truth for the
 * persisted sale; these helpers exist so the order summary can show Subtotal / Tax /
 * Grand Total live, before submit. The formula here MUST match the backend so the
 * numbers don't jump when the sale is saved.
 *
 * Conventions:
 * - `taxRate` is a percent (e.g. 15 means 15%).
 * - `taxType` describes the price semantics:
 *     - "exclusive": tax is added on top of the (discounted) net.
 *     - "inclusive": the price already contains the tax, which is backed out for reporting.
 * - Discount is applied BEFORE tax (line discount, then order-level discount).
 * - The order-level (additional) discount is spread across lines proportionally to each
 *   line's net, then tax is computed on the reduced net.
 * - Each line's tax is rounded to 2 decimals, then summed (avoids drift).
 */

import type { TaxType } from "@/types";

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** A safe non-negative finite number, or 0. */
const safe = (n: number | undefined): number =>
  typeof n === "number" && isFinite(n) && n > 0 ? n : 0;

export interface TaxLineInput {
  /** Unit price. */
  price: number;
  quantity: number;
  /** Per-unit discount amount (matches the cart's `item.discount`). */
  discount?: number;
  /** Tax rate (percent). 0 / undefined = no tax. */
  taxRate?: number;
  /** Price semantics; defaults to "inclusive". */
  taxType?: TaxType;
}

export interface TaxLineResult {
  /** Taxable base (net of tax) for the line, after line + order discount. */
  base: number;
  /** Tax amount for the line (rounded to 2dp). */
  taxAmount: number;
  /** Gross line total incl. tax (base + tax for exclusive; the discounted price for inclusive). */
  lineTotal: number;
  taxRate: number;
  taxType: TaxType;
}

export interface TaxBreakdownRow {
  taxRate: number;
  taxType: TaxType;
  /** Sum of taxable bases at this rate/type. */
  taxableBase: number;
  /** Sum of tax at this rate/type. */
  taxAmount: number;
}

export interface OrderTaxResult {
  /** Σ line net as entered (line-discounted, before order discount). Matches the current "Subtotal". */
  itemsSubtotal: number;
  /** The order-level discount actually applied (clamped to [0, itemsSubtotal]). */
  additionalDiscount: number;
  /** Σ exclusive line tax — the portion that ADDS to the subtotal to reach the grand total. */
  addedTax: number;
  /** Σ inclusive line tax — informational ("of which tax"); already inside the subtotal. */
  includedTax: number;
  /** addedTax + includedTax — total tax in the order (for the invoice tax line). */
  taxTotal: number;
  /** Payable total. */
  grandTotal: number;
  /** Per-line results, in input order. */
  lines: TaxLineResult[];
  /** Tax grouped by rate + type, for the invoice breakdown. */
  breakdownByRate: TaxBreakdownRow[];
}

/**
 * Split a monetary amount into base + tax for a single rate.
 *
 * @param amount - For "exclusive" this is the net (tax added on top). For "inclusive"
 *   this is the gross (tax already inside).
 */
function splitTax(
  amount: number,
  rate: number,
  taxType: TaxType,
): { base: number; taxAmount: number; lineTotal: number } {
  const r = safe(rate);
  if (r <= 0) {
    return { base: round2(amount), taxAmount: 0, lineTotal: round2(amount) };
  }
  if (taxType === "inclusive") {
    const base = amount / (1 + r / 100);
    const taxAmount = round2(amount - base);
    return { base: round2(base), taxAmount, lineTotal: round2(amount) };
  }
  // exclusive
  const taxAmount = round2((amount * r) / 100);
  return { base: round2(amount), taxAmount, lineTotal: round2(amount + taxAmount) };
}

/** Net of a line after its per-unit discount, before any order-level discount. */
function lineNet(input: TaxLineInput): number {
  const unitNet = Math.max(0, safe(input.price) - safe(input.discount));
  return round2(unitNet * safe(input.quantity));
}

/**
 * Tax for a single line, ignoring any order-level discount.
 * Useful for showing per-line tax in the cart.
 */
export function computeLineTax(input: TaxLineInput): TaxLineResult {
  const taxType: TaxType = input.taxType ?? "inclusive";
  const { base, taxAmount, lineTotal } = splitTax(lineNet(input), input.taxRate ?? 0, taxType);
  return { base, taxAmount, lineTotal, taxRate: safe(input.taxRate), taxType };
}

/**
 * Full order tax rollup with order-level (additional) discount applied before tax.
 *
 * @param items - Line inputs.
 * @param additionalDiscount - Fixed order-level discount amount, spread proportionally.
 */
export function computeOrderTax(
  items: TaxLineInput[],
  additionalDiscount = 0,
): OrderTaxResult {
  const nets = items.map(lineNet);
  const totalNet = round2(nets.reduce((sum, n) => sum + n, 0));
  const orderDiscount = Math.min(Math.max(0, safe(additionalDiscount)), totalNet);

  // Spread the order discount, then reconcile what rounding lost.
  //
  // Each line's share is rounded to 2dp independently, so a discount that does
  // not divide cleanly leaves the sum a paisa off the discount the merchant
  // typed. On ৳100 / ৳5,200 / ৳600 less ৳150 the lines round to
  // 97.46 + 5,067.80 + 584.75 = ৳5,750.01 against a ৳5,750.00 order — and the
  // POS pre-fills Paid from the typed total, so the sale posted `partial` with
  // a ৳0.01 due and a `CustomerDue` row nobody can ever collect (QA-T1-A).
  //
  // The residual lands on the LARGEST line: least likely to matter there, and
  // it cannot push a line negative. Ties go to the first, so the result is
  // deterministic. **Byte-identical to the backend's `applyLineTaxes`** — the
  // two are a cross-repo contract with paired tests, and reconciling on only
  // one side turns a rounding bug into a FE/BE mismatch.
  const discountedNets = nets.map((net) => {
    const share = totalNet > 0 ? net / totalNet : 0;
    return Math.max(0, round2(net - orderDiscount * share));
  });
  if (discountedNets.length > 0) {
    const target = round2(totalNet - orderDiscount);
    const spread = round2(discountedNets.reduce((sum, n) => sum + n, 0));
    const residual = round2(target - spread);
    if (residual !== 0) {
      let largest = 0;
      for (let i = 1; i < nets.length; i++) {
        if (nets[i] > nets[largest]) largest = i;
      }
      discountedNets[largest] = Math.max(
        0,
        round2(discountedNets[largest] + residual),
      );
    }
  }

  const lines: TaxLineResult[] = items.map((input, i) => {
    const discountedNet = discountedNets[i];
    const taxType: TaxType = input.taxType ?? "inclusive";
    const { base, taxAmount, lineTotal } = splitTax(discountedNet, input.taxRate ?? 0, taxType);
    return { base, taxAmount, lineTotal, taxRate: safe(input.taxRate), taxType };
  });

  let addedTax = 0;
  let includedTax = 0;
  let grandTotal = 0;
  for (const line of lines) {
    if (line.taxType === "inclusive") includedTax += line.taxAmount;
    else addedTax += line.taxAmount;
    grandTotal += line.lineTotal;
  }
  addedTax = round2(addedTax);
  includedTax = round2(includedTax);

  return {
    itemsSubtotal: totalNet,
    additionalDiscount: round2(orderDiscount),
    addedTax,
    includedTax,
    taxTotal: round2(addedTax + includedTax),
    grandTotal: round2(grandTotal),
    lines,
    breakdownByRate: buildBreakdown(lines),
  };
}

/** Group line tax by rate + type for the invoice breakdown (skips zero-rate lines). */
function buildBreakdown(lines: TaxLineResult[]): TaxBreakdownRow[] {
  const map = new Map<string, TaxBreakdownRow>();
  for (const line of lines) {
    if (line.taxRate <= 0 || line.taxAmount <= 0) continue;
    const key = `${line.taxRate}-${line.taxType}`;
    const row = map.get(key);
    if (row) {
      row.taxableBase = round2(row.taxableBase + line.base);
      row.taxAmount = round2(row.taxAmount + line.taxAmount);
    } else {
      map.set(key, {
        taxRate: line.taxRate,
        taxType: line.taxType,
        taxableBase: line.base,
        taxAmount: line.taxAmount,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.taxRate - a.taxRate);
}

/**
 * Sum stored per-line tax into added (exclusive, on top) vs included (inclusive,
 * already in price) buckets. For detail/receipt views that read a posted doc's
 * line snapshot (each line carries `taxType` + `taxAmount`). Single source for
 * the "Tax (added) / Tax in price" split — do NOT re-derive inline.
 */
export function splitLineTax(
  items: { taxType?: TaxType; taxAmount?: number }[],
): { addedTax: number; includedTax: number; taxTotal: number } {
  let addedTax = 0;
  let includedTax = 0;
  for (const it of items) {
    const amount = it.taxAmount ?? 0;
    if (amount <= 0) continue;
    if (it.taxType === "exclusive") addedTax += amount;
    else if (it.taxType === "inclusive") includedTax += amount;
  }
  addedTax = round2(addedTax);
  includedTax = round2(includedTax);
  return { addedTax, includedTax, taxTotal: round2(addedTax + includedTax) };
}

/**
 * The "Includes ৳X tax in price [· total tax ৳Y]" reconciliation memo — single
 * source for the wording. Returns null when there is no inclusive tax to explain.
 * Used by `<TaxSummaryLines>` and the return document summary card so the line
 * never drifts between surfaces.
 */
export function taxInclusiveMemo(
  includedTax: number,
  taxTotal: number,
  addedTax: number,
  formatCurrency: (n: number) => string,
): string | null {
  if (!(includedTax > 0)) return null;
  return `Includes ${formatCurrency(includedTax)} tax in price${
    addedTax > 0 ? ` · total tax ${formatCurrency(taxTotal)}` : ""
  }`;
}
