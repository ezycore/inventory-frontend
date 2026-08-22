"use client";
// coding-standard: maintained

import { useHydrated } from "@/hooks/use-hydrated";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import type { StorefrontContactButton } from "@/types";

type Hours = NonNullable<StorefrontContactButton["hours"]>;

/**
 * Is the merchant outside their stated reply hours right now, and what should
 * the launcher say about it.
 *
 * **Gated on `useHydrated`.** This reads a clock, so computing it during SSR
 * would bake the *server's* "now" into the HTML — a shop rendered at 2 a.m.
 * would ship "Away" to a shopper browsing at noon, and the first client
 * render would disagree with it. Before hydration it always answers "open",
 * which is the safe default: a shopper who messages an away merchant still
 * becomes a lead, where a wrongly-away button loses one.
 *
 * **The comparison runs in the SHOP's timezone, not the visitor's** (QA-115).
 * A Dhaka pharmacy open 09:00–22:00 used to tell every shopper outside
 * Bangladesh it was closed — diaspora customers, and a store demoed or
 * recorded from another timezone. `timezone` comes from the public payload
 * (`storeInfoDto`); an older backend or a malformed IANA name leaves it
 * unusable, and `nowInZone` falls back to the visitor's own clock rather than
 * refusing to answer — the storefront still needs to say something.
 */
export function useContactHours(
  hours: Hours | undefined,
  timezone: string | undefined,
): {
  isAway: boolean;
  note?: string;
} {
  const hydrated = useHydrated();
  const { t } = useStorefrontUI();

  if (!hydrated || !hours?.enabled) return { isAway: false };

  const from = parseHm(hours.from);
  const to = parseHm(hours.to);
  if (from === null || to === null) return { isAway: false };

  const { day, minutes } = nowInZone(timezone);
  const days = hours.days?.length ? hours.days : [0, 1, 2, 3, 4, 5, 6];
  const openToday = days.includes(day);

  // A window that wraps midnight ("20:00"–"02:00") is inclusive of both ends of
  // the wrap, not an empty range — the naive `from <= n && n < to` reads it as
  // "never open" and would strand a late-night shop permanently away.
  const withinWindow =
    from <= to ? minutes >= from && minutes < to : minutes >= from || minutes < to;

  if (openToday && withinWindow) return { isAway: false };

  return {
    isAway: true,
    note: hours.offlineNote?.trim() || t.chatAway.replace("{when}", formatHm(hours.from)),
  };
}

/** Sunday-first, matching `Date#getDay()` and the merchant's `hours.days`. */
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * "Right now" as a day-of-week (0=Sun) and minutes-since-midnight, in
 * `timezone` when it resolves to a real IANA zone, else the visitor's own.
 * `hourCycle: "h23"` is deliberate: `hour12: false` alone can format midnight
 * as "24" rather than "00" in some engines, which would read as tomorrow.
 */
function nowInZone(timezone: string | undefined): { day: number; minutes: number } {
  const now = new Date();
  try {
    if (!timezone) throw new Error("no timezone on the payload");
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
    const get = (type: string) => parts.find((p) => p.type === type)?.value;
    const day = WEEKDAYS_SHORT.indexOf(get("weekday") ?? "");
    const hour = Number(get("hour"));
    const minute = Number(get("minute"));
    if (day < 0 || Number.isNaN(hour) || Number.isNaN(minute)) {
      throw new Error("unparseable Intl output");
    }
    return { day, minutes: hour * 60 + minute };
  } catch {
    // Invalid/absent timezone — fall back to the visitor's clock rather than
    // guessing "open" or "away" outright.
    return { day: now.getDay(), minutes: now.getHours() * 60 + now.getMinutes() };
  }
}

/** "HH:mm" → minutes since midnight, or null when the merchant left it blank. */
function parseHm(value: string | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value?.trim() ?? "");
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** "10:00" → "10:00 AM", for the away note. */
function formatHm(value: string | undefined): string {
  const minutes = parseHm(value);
  if (minutes === null) return "";
  const h24 = Math.floor(minutes / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = String(minutes % 60).padStart(2, "0");
  return `${h12}:${mm} ${h24 < 12 ? "AM" : "PM"}`;
}
