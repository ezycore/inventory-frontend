// coding-standard: maintained
/**
 * A landing page's schedule on the admin side — what the backend's
 * `utils/storefront-page-schedule.ts` decides for shoppers, read here for the
 * merchant, plus the conversion between the stored instant and the date and
 * time fields the settings dialog edits.
 *
 * **Times are the merchant's device's.** The fields show and take local time and
 * the backend stores the instant, which is what a merchant setting "ends at 9 pm"
 * on their own phone means.
 */
import { format, isValid, parse } from "date-fns";
import type { StorefrontPage } from "@/services/api";

export type PageSchedule = NonNullable<StorefrontPage["schedule"]>;
export type PageAfterEnd = PageSchedule["afterEnd"];
export type PageScheduleState = "upcoming" | "live" | "ended";

/** Where a page stands against its schedule, or `null` when it has none. */
export function pageScheduleState(
  schedule: PageSchedule | null | undefined,
  now: number = Date.now(),
): PageScheduleState | null {
  if (!schedule || (!schedule.startsAt && !schedule.endsAt)) return null;
  if (schedule.startsAt && Date.parse(schedule.startsAt) > now) return "upcoming";
  if (schedule.endsAt && Date.parse(schedule.endsAt) <= now) return "ended";
  return "live";
}

/** The two field values for a stored instant: `yyyy-MM-dd` and `HH:mm`, local. */
export function localParts(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const value = new Date(iso);
  if (!isValid(value)) return { date: "", time: "" };
  return { date: format(value, "yyyy-MM-dd"), time: format(value, "HH:mm") };
}

/**
 * The instant two fields name, or `null` with no date. A date with no time is
 * the start of that day — the reading "starts on the 20th" has.
 */
export function instantOf(date: string, time: string): string | null {
  if (!date) return null;
  const value = parse(`${date} ${time || "00:00"}`, "yyyy-MM-dd HH:mm", new Date());
  return isValid(value) ? value.toISOString() : null;
}

const when = (iso: string) => format(new Date(iso), "d MMM yyyy, h:mm a");

/** One line for the page list: the next thing the schedule will do, or what it did. */
export function scheduleSummary(
  schedule: PageSchedule | null | undefined,
  now: number = Date.now(),
): string | null {
  const state = pageScheduleState(schedule, now);
  if (!schedule || !state) return null;
  if (state === "upcoming") return `Starts ${when(schedule.startsAt as string)}`;
  if (state === "ended") return `Ended ${when(schedule.endsAt as string)}`;
  return schedule.endsAt ? `Ends ${when(schedule.endsAt)}` : null;
}

/** What the settings dialog edits: the fields as typed, before they name an instant. */
export interface ScheduleDraft {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  afterEnd: PageAfterEnd;
  afterEndPageId: string;
}

export function scheduleDraftOf(schedule: PageSchedule | null | undefined): ScheduleDraft {
  const start = localParts(schedule?.startsAt);
  const end = localParts(schedule?.endsAt);
  return {
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
    afterEnd: schedule?.afterEnd ?? "not-found",
    afterEndPageId: schedule?.afterEndPageId ?? "",
  };
}

/**
 * The body the backend takes, or `null` for no schedule. "What happens after
 * the end" means nothing without an end, so it is sent as the default then — a
 * merchant who clears the end has not chosen a redirect for an end that is gone.
 */
export function scheduleBodyOf(draft: ScheduleDraft) {
  const startsAt = instantOf(draft.startDate, draft.startTime);
  const endsAt = instantOf(draft.endDate, draft.endTime);
  if (!startsAt && !endsAt) return null;
  const afterEnd: PageAfterEnd = endsAt ? draft.afterEnd : "not-found";
  return {
    startsAt,
    endsAt,
    afterEnd,
    afterEndPageId: afterEnd === "page" ? draft.afterEndPageId || null : null,
  };
}

/** The first thing stopping a save, in the backend's words, or `null`. */
export function scheduleProblem(draft: ScheduleDraft): string | null {
  const body = scheduleBodyOf(draft);
  if (!body) return null;
  if (body.startsAt && body.endsAt && Date.parse(body.endsAt) <= Date.parse(body.startsAt)) {
    return "The end must be after the start";
  }
  if (body.afterEnd === "page" && !body.afterEndPageId) return "Choose the page to send shoppers to";
  return null;
}
