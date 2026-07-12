// coding-standard: maintained
import { cn } from "@/ui/lib/utils";

export type Lifecycle = "live" | "scheduled" | "expired" | "paused";

/**
 * Real state of a scheduled promotion (campaign/coupon): the stored `status`
 * is only the merchant's on/off toggle — the date window decides whether it
 * actually applies. Pricing enforces the same rule server-side.
 */
export function deriveLifecycle(row: {
  status: string;
  startsAt?: string | null;
  endsAt?: string | null;
}): Lifecycle {
  if (row.status !== "active") return "paused";
  const now = Date.now();
  if (row.startsAt && new Date(row.startsAt).getTime() > now) return "scheduled";
  if (row.endsAt && new Date(row.endsAt).getTime() < now) return "expired";
  return "live";
}

const STYLES: Record<Lifecycle, { label: string; className: string }> = {
  live: { label: "Live", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" },
  scheduled: { label: "Scheduled", className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400" },
  expired: { label: "Expired", className: "bg-muted text-muted-foreground" },
  paused: { label: "Paused", className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400" },
};

/** Campaign/coupon status cell — shows what the shopper actually experiences. */
export function LifecycleBadge({
  status,
  startsAt,
  endsAt,
}: {
  status: string;
  startsAt?: string | null;
  endsAt?: string | null;
}) {
  const state = deriveLifecycle({ status, startsAt, endsAt });
  const s = STYLES[state];
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        s.className,
      )}
    >
      {s.label}
    </span>
  );
}
