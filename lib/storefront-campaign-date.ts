// coding-standard: maintained

/**
 * The "Ends <date>" label a campaign shows on the storefront — the promo strip
 * under the header and the deal cards in the home bands.
 *
 * Day + short month is enough for a sale finishing this year, which is the
 * common case and keeps the strip on one line. A campaign can be scheduled years
 * out, though, and "Ends 3 Jan" on a date two Januaries away reads as *next
 * week* — so the year is appended whenever the end date falls outside the
 * current one.
 *
 * `toLocaleDateString(langCode)` localizes the numerals as well as the month
 * name, which a hand-built "2d 4h" countdown could not do without inventing
 * Bengali unit abbreviations that are not in the glossary.
 *
 * One function rather than the formatting inline in both components: the strip
 * and the deal card must never disagree about when the same campaign ends.
 */
export function campaignEndsLabel(
  endsAt: string | null | undefined,
  langCode: string,
  now: Date = new Date(),
): string | null {
  if (!endsAt) return null;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return null;

  return end.toLocaleDateString(langCode, {
    day: "numeric",
    month: "short",
    // Only when it adds information — a same-year date is unambiguous without it.
    ...(end.getFullYear() === now.getFullYear() ? null : { year: "numeric" }),
  });
}
