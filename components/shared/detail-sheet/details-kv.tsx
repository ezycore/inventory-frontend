// coding-standard: maintained
import { Fragment, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@ui/lib/utils';

export interface DetailsKvRow {
  label: string;
  /** Nullish / empty-string values are skipped, so callers can pass optionals directly. */
  value: ReactNode;
  /** Visually quiet row for internal figures (cost basis etc.). */
  muted?: boolean;
}

/**
 * Plain label–value block for a detail sheet's low-priority metadata
 * (created by/at, counterparty, reason…). Deliberately unboxed — the boxed
 * card treatment is reserved for the StatStrip headline figures.
 */
export function DetailsKv({ title, rows }: { title?: string; rows: DetailsKvRow[] }) {
  const t = useTranslations('common.detail');
  const visible = rows.filter((r) => r.value !== null && r.value !== undefined && r.value !== '');
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{title ?? t('details')}</div>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-[150px_1fr]">
        {visible.map((row) => (
          <Fragment key={row.label}>
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd
              className={cn(
                'break-words font-medium',
                row.muted && 'font-normal text-muted-foreground',
              )}
            >
              {row.value}
            </dd>
          </Fragment>
        ))}
      </dl>
    </div>
  );
}
