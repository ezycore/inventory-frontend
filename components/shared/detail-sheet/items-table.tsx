// coding-standard: maintained
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/ui/components/badge';

/** Compact cell sizing for detail-sheet item tables (SimpleTable className). */
export const detailTableClass =
  'text-[13px] [&_th]:h-9 [&_th]:px-2 [&_th]:text-xs [&_td]:px-2 [&_td]:py-2';

/** Tinted row for a combo group header (dark-mode safe). */
export const comboRowClass =
  'bg-orange-50/40 hover:bg-orange-50/60 dark:bg-orange-950/20 dark:hover:bg-orange-950/30';

export function ComboBadge() {
  const t = useTranslations('common.detail');
  return (
    <Badge className="border-0 bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400">
      {t('combo')}
    </Badge>
  );
}

/** First-column cell: item name with an optional muted subline (cost, variant, received…). */
export function ItemCell({
  name,
  sub,
  indent = false,
}: {
  name: ReactNode;
  sub?: ReactNode;
  indent?: boolean;
}) {
  return (
    <div className={indent ? 'pl-4' : undefined}>
      <div className="font-medium">{name}</div>
      {sub ? <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}
