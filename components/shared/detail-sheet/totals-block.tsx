// coding-standard: maintained

export interface TotalsRow {
  label: string;
  value: string;
  /** Informational figure that doesn't add to the total (e.g. in-price tax). */
  muted?: boolean;
}

interface TotalsBlockProps {
  /** Left-aligned meta line, e.g. "3 products · 56 units". */
  meta?: string;
  rows: TotalsRow[];
  total: { label: string; value: string };
}

/**
 * Right-aligned money breakdown rendered directly under an items table —
 * subtotal, discounts and tax read in context of the lines they summarize.
 */
export function TotalsBlock({ meta, rows, total }: TotalsBlockProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      {meta ? <span className="text-xs text-muted-foreground">{meta}</span> : null}
      <div className="ml-auto w-full max-w-[280px] text-sm tabular-nums">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-6 py-0.5">
            <span className="text-muted-foreground">{row.label}</span>
            <span className={row.muted ? 'text-muted-foreground' : undefined}>{row.value}</span>
          </div>
        ))}
        <div className="mt-1 flex justify-between gap-6 border-t pt-1.5 font-semibold">
          <span>{total.label}</span>
          <span>{total.value}</span>
        </div>
      </div>
    </div>
  );
}
