"use client";
// coding-standard: maintained

import { cn } from "@/ui/lib/utils";

import { CLOSED_STATUSES } from "./helpers";

const LABELS: Record<(typeof CLOSED_STATUSES)[number], string> = {
  cancelled: "Cancelled",
  rejected: "Rejected",
  returned: "Returned",
};

/**
 * The split inside the Closed tab — All · Cancelled · Rejected · Returned.
 *
 * Closed folds three statuses on purpose (one tab for "nothing left to do"), which hid how
 * many of each it held: 11 closed was 3 cancelled + 7 rejected + 1 returned, and only the
 * Orders Report said so. A chip filters to one raw status; the Closed tab stays highlighted
 * because `isTabActive` treats a member status as its tab. Counts are the server's per-status
 * totals — the same source as the tab counts, so they add up to Closed.
 */
export function ClosedStatusChips({
  status,
  counts,
  onChange,
}: {
  /** The list's current status filter — `closed` or one of its members. */
  status: string;
  counts: Record<string, number | undefined>;
  onChange: (status: string) => void;
}) {
  const chips = [
    { value: "closed", label: "All", count: counts.closed },
    ...CLOSED_STATUSES.map((value) => ({ value, label: LABELS[value], count: counts[value] })),
  ];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Closed orders by status">
      {chips.map((chip) => {
        const active = status === chip.value;
        return (
          <button
            key={chip.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(chip.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {chip.label}
            <span className="tabular-nums opacity-70">{chip.count ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}
