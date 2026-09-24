// coding-standard: maintained
import type { StorefrontPageListItem } from "@/services/api";
import type { StatusBadgeProps } from "@/ui/components/status-badge";
import { pageScheduleState, scheduleSummary } from "./page-schedule";

export interface PageStatus {
  /** The badge's colour. */
  variant: StatusBadgeProps["status"];
  /** The badge's word, in the merchant's terms. */
  label: string;
  /** The schedule's next step (or last one), when the page has a schedule. */
  note: string | null;
}

/**
 * What a shopper gets from a page right now, as one badge.
 *
 * "Published" alone would read as live for an offer that has not started or is
 * over, so a published page's schedule decides the word: Scheduled before it
 * starts, Ended after, Live otherwise.
 */
export function pageStatus(
  page: Pick<StorefrontPageListItem, "status" | "schedule">,
  now: number = Date.now(),
): PageStatus {
  if (page.status === "draft") return { variant: "draft", label: "Draft", note: null };
  if (page.status === "disabled") return { variant: "disabled", label: "Off", note: null };
  const note = scheduleSummary(page.schedule, now);
  const state = pageScheduleState(page.schedule, now);
  if (state === "upcoming") return { variant: "scheduled", label: "Scheduled", note };
  // Grey, not red: an offer that ran its course is finished work, not a fault.
  if (state === "ended") return { variant: "inactive", label: "Ended", note };
  return { variant: "published", label: "Live", note };
}
