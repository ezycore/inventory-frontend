// coding-standard: maintained

/**
 * The "Ends …" label a campaign shows on the storefront — the promo strip under
 * the header and the deal cards in the offer bands.
 *
 * **One instant, shown in the shopper's own zone.** `endsAt` is a fixed instant:
 * the backend sets it to the end of the merchant's chosen day in the
 * ORGANIZATION's timezone, and decides whether a campaign is live by comparing
 * that instant with now — the shopper's zone never changes that. This label only
 * prints the same instant on the viewer's clock, so a campaign ending 17 Sep
 * 11:59 PM in Dhaka reads "Ends Sep 17 at 11:29 PM" in India and
 * "Ends Sep 18 at 2:59 AM" in Japan (CLAUDE.md → Timezones).
 *
 * Because it depends on the viewer's zone, it can only be computed in the
 * browser: callers render it after hydration (`useHydrated`). The server runs in
 * UTC and does not know the shopper's zone, so a server-rendered label would
 * disagree with the hydrating client on every page view outside UTC.
 *
 * The year is added whenever the end date falls outside the current year (both
 * read in the same zone): a campaign can be scheduled years out, and
 * "Ends 3 Jan" on a date two Januaries away reads as next week.
 *
 * The date and time come from `Intl` in the storefront language, which localizes
 * the month name and the numerals; `template` (the storefront dictionary's
 * `campaignEndsAt`, e.g. `"Ends {date} at {time}"`) joins them, so each language
 * words the phrase naturally rather than as "Ends" + a formatter's output.
 *
 * One function rather than formatting inline in both components: the strip and
 * the deal card must never disagree about when the same campaign ends.
 */
export function campaignEndsLabel(
  endsAt: string | null | undefined,
  language: { langCode: string; campaignEndsAt: string },
  now: Date = new Date(),
  /** The zone to print in. Omitted in the storefront = the viewer's own zone. */
  timeZone?: string,
): string | null {
  if (!endsAt) return null;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return null;

  const zone = timeZone ? { timeZone } : {};
  const yearOf = (date: Date) =>
    new Intl.DateTimeFormat("en-US", { year: "numeric", ...zone }).format(date);

  const date = end.toLocaleDateString(language.langCode, {
    day: "numeric",
    month: "short",
    // Only when it adds information — a same-year date is unambiguous without it.
    ...(yearOf(end) === yearOf(now) ? null : { year: "numeric" }),
    ...zone,
  });
  const time = end.toLocaleTimeString(language.langCode, {
    hour: "numeric",
    minute: "2-digit",
    ...zone,
  });

  return language.campaignEndsAt.replace("{date}", date).replace("{time}", time);
}
