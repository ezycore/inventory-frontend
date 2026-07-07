// coding-standard: maintained
import type { ReactNode } from "react";

interface SheetHeaderBarProps {
  /** Title + description block (left side). */
  children: ReactNode;
  /** Right-aligned action, typically a <PrintMenu appearance="solid" />. */
  action?: ReactNode;
}

/**
 * Shared detail-sheet header layout: the title/description on the left and a
 * right-aligned action (the print split-button) on the same row. `pr-8` clears
 * the sheet's absolute close button; the bottom border separates the header from
 * the scrolling body — so no orphan action row / dead space below the heading.
 */
export function SheetHeaderBar({ children, action }: SheetHeaderBarProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b pb-4 pr-8">
      <div className="space-y-1">{children}</div>
      {action}
    </div>
  );
}
