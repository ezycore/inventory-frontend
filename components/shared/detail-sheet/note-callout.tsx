// coding-standard: maintained
import type { ReactNode } from 'react';

/** Slim notes callout for detail sheets — replaces the full bordered card. */
export function NoteCallout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-r-md border-l-2 bg-muted/30 px-3.5 py-2.5">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Notes
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
