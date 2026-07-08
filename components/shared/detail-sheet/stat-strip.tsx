// coding-standard: maintained
import type { ReactNode } from 'react';
import { cn } from '@ui/lib/utils';

/**
 * Headline stat row for detail sheets: the 3–4 figures a user opens the
 * sheet for (Total / Paid / Due / Refunded…). Tiles wrap on narrow widths.
 */
export function StatStrip({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2.5">{children}</div>;
}

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Small line under the value, e.g. "2 returns". */
  sub?: ReactNode;
  /** Tone class for the value, e.g. "text-green-600". */
  valueClassName?: string;
}

export function StatTile({ label, value, sub, valueClassName }: StatTileProps) {
  return (
    <div className="min-w-[128px] flex-1 rounded-lg border bg-muted/30 px-3 py-2.5">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={cn('mt-0.5 text-lg leading-tight font-semibold tabular-nums', valueClassName)}>
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}
