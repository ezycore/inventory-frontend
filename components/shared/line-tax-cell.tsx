"use client";

import type { FC } from "react";

/**
 * Shared per-line Tax cell for the sales + purchase cart tables. Renders the
 * line's tax amount (`+` prefix for exclusive), with a muted `rate%` (and
 * `incl.` for inclusive) underneath. `—` when the line has no tax. Single source
 * for the cart Tax column — callers compute `amount` via `computeLineTax`
 * (sales maps price + line discount; purchase maps costPrice + 0) and pass it in.
 */
type Props = {
  rate?: number;
  amount: number;
  type?: "inclusive" | "exclusive";
  formatCurrency: (n: number) => string;
};

export const LineTaxCell: FC<Props> = ({ rate, amount, type, formatCurrency }) => {
  if (!rate) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="text-sm tabular-nums">
      {type === "exclusive" ? "+" : ""}
      {formatCurrency(amount)}
      <span className="block text-xs text-muted-foreground">
        {rate}%{type === "inclusive" ? " incl." : ""}
      </span>
    </span>
  );
};

export default LineTaxCell;
