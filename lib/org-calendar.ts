// coding-standard: maintained
/**
 * The organization's calendar on the client (CLAUDE.md → "Timezones").
 *
 * Merchant-facing days are cut in `organization.timezone`, and weeks start on
 * `organization.weekStartDay` — never on the browser's zone, the server's zone
 * or a hard-coded Monday. A merchant in Dhaka browsing from a laptop set to UTC
 * must see the same "today" as the backend computes.
 *
 * Two kinds of date travel over the wire, and they are read differently:
 * - an INSTANT (`createdAt`, `paidAt`) is formatted in the org's zone;
 * - a DATE-ONLY value (`expiryDate`, a picked `YYYY-MM-DD`) is stored as UTC
 *   midnight of its day and read back in UTC, so it names the same day in every
 *   zone.
 *
 * Mirrors `inventory-backend/src/utils/{timezone,date-only,expiry-date}.ts`.
 */
import { formatInTimeZone } from "date-fns-tz";

/** Zone used when an org has none (or an invalid one) — never the browser's. */
export const DEFAULT_TIMEZONE = "Asia/Dhaka";

/** Sunday. The week start of an org that has not chosen one. */
export const DEFAULT_WEEK_START_DAY = 0;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The org's zone when `Intl` accepts it, else `DEFAULT_TIMEZONE`. */
export function resolveTimezone(value: string | null | undefined): string {
  if (!value) return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

/** The org's week start when it is an integer 0–6, else Sunday. */
export function resolveWeekStartDay(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 6
    ? value
    : DEFAULT_WEEK_START_DAY;
}

/** `YYYY-MM-DD` of `now` on the org's calendar. */
export function orgDateKey(timezone: string | null | undefined, now: Date = new Date()): string {
  return formatInTimeZone(now, resolveTimezone(timezone), "yyyy-MM-dd");
}

/**
 * `YYYY-MM-DD` of the org-local day a stored instant falls on, or `""` for none.
 * How a whole-day window bound (campaign `startsAt`/`endsAt`, coupon
 * `validFrom`/`validUntil`) goes back into a date field: a Dhaka org's campaign
 * starting 10 Sep is stored as `2026-09-09T18:00:00.000Z`, which the browser's
 * zone (or UTC) would call the 9th.
 */
export function orgDayOfInstant(
  value: string | null | undefined,
  timezone: string | null | undefined,
): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : orgDateKey(timezone, date);
}

/**
 * `YYYY-MM-DD` of a day picked in a calendar widget. The picker hands back local
 * midnight of the day the merchant CLICKED, so its local parts are that day — the
 * one place reading a date's local parts is right. Never pass an instant here.
 */
export function pickedDayKey(picked: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${picked.getFullYear()}-${pad(picked.getMonth() + 1)}-${pad(picked.getDate())}`;
}

/** `YYYY-MM-DD` a stored date-only value names (it is UTC midnight of that day). */
export function storedDateKey(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

const keyToUtc = (key: string): number =>
  Date.UTC(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));

/**
 * Whole calendar days from the org's today to a stored date-only value:
 * `0` on the day itself, negative once it has passed.
 */
export function daysUntilDateOnly(
  value: string | Date,
  timezone: string | null | undefined,
  now: Date = new Date(),
): number {
  return Math.round((keyToUtc(storedDateKey(value)) - keyToUtc(orgDateKey(timezone, now))) / DAY_MS);
}

/**
 * Has an expiry date passed? A lot is good through the WHOLE of its expiry date
 * on the org's calendar and expires when that local day ends — the backend's
 * `isPastExpiry` rule. A lot with no date never expires.
 */
export function isExpiryPast(
  expiryDate: string | Date | null | undefined,
  timezone: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return expiryDate != null && storedDateKey(expiryDate) < orgDateKey(timezone, now);
}

/** Is a picked `YYYY-MM-DD` before the org's today? */
export function isDateKeyBeforeOrgToday(
  dateKey: string,
  timezone: string | null | undefined,
  now: Date = new Date(),
): boolean {
  return dateKey.slice(0, 10) < orgDateKey(timezone, now);
}
