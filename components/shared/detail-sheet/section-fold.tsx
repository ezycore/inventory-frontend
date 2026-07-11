'use client';
// coding-standard: maintained

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/ui/components/collapsible';

interface SectionFoldProps {
  title: string;
  /** Entry count shown after the title; pass "…" while loading. */
  count?: number | string;
  /** Right-aligned one-line summary visible while folded. */
  peek?: ReactNode;
  /** Interactive node (e.g. an Add Payment button) — rendered outside the trigger. */
  action?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

/**
 * Collapsible history section for detail sheets (Payments / Returns /
 * Transactions). The header stays one row tall; `peek` keeps the key figure
 * visible while folded. Empty sections should use `EmptySectionsLine` instead.
 */
export function SectionFold({
  title,
  count,
  peek,
  action,
  defaultOpen = false,
  children,
}: SectionFoldProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="rounded-lg border">
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <CollapsibleTrigger className="group flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
          <span className="truncate">
            {title}
            {count !== undefined && (
              <span className="ml-1 font-normal text-muted-foreground">({count})</span>
            )}
          </span>
          {peek ? (
            <span className="ml-auto truncate text-xs font-normal text-muted-foreground">
              {peek}
            </span>
          ) : null}
        </CollapsibleTrigger>
        {action}
      </div>
      <CollapsibleContent>
        <div className="border-t px-3.5 py-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * One-line stand-in for history sections that have no entries — replaces
 * stacked full-height empty states ("Returns — none · Transactions — none").
 */
export function EmptySectionsLine({ sections }: { sections: string[] }) {
  const t = useTranslations('common.detail');
  if (sections.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-dashed px-3.5 py-2.5 text-xs text-muted-foreground">
      {sections.map((name) => (
        <span key={name}>
          {t.rich('sectionNone', {
            name,
            b: (chunks) => <span className="font-medium">{chunks}</span>,
          })}
        </span>
      ))}
    </div>
  );
}
