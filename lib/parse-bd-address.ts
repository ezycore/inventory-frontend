// coding-standard: maintained
import { BD_DISTRICTS, upazilasOf } from "./bd-geo";
import { normalizeBdPhone } from "@/services/storefront/bd-phone";

/**
 * Pull a name, phone, district, area and street address out of the blob a BD
 * buyer sends in chat.
 *
 * Buyers do not fill in forms — they type three lines into Messenger:
 *
 *     রহিম উদ্দিন
 *     01712345678
 *     বাসা ১২, রোড ৪, ধানমন্ডি, ঢাকা
 *
 * and the merchant retypes them into five fields. This turns ~40 seconds of
 * retyping into ~10 seconds of correcting, which is the highest
 * effort-to-payoff item in the omnichannel plan.
 *
 * **It is a PREFILL, not a validator.** Everything it returns lands in an
 * editable field the merchant reviews, and the server validates the submission
 * normally. That is what licenses the rules below to be forgiving.
 *
 * **It never guesses a district.** A wrong district silently routes a parcel to
 * the wrong courier zone and prices the delivery wrong — far more expensive than
 * an empty field the merchant fills in. So partial success is the designed
 * outcome: parse what is certain, leave the rest blank.
 *
 * **Frontend-only, deliberately.** `bd-geo.json` lives here and the backend build
 * does not copy `.json` assets — the reason the backend geo module was deferred
 * during the courier work. Keeping the parser client-side avoids reopening that.
 */

export interface ParsedBdAddress {
  name?: string;
  /** Canonical local form (`01712345678`), ready for the phone field. */
  phone?: string;
  /** Exact English district name, so it matches the picker's option value. */
  district?: string;
  /** Exact area name from the district's suggestion set. */
  area?: string;
  /** Everything not claimed above, joined — house/road/landmark lines. */
  address?: string;
}

const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";
const toWestern = (s: string) =>
  s.replace(/[০-৯]/g, (d) => String(BENGALI_DIGITS.indexOf(d)));

/**
 * Compare loosely enough to survive how people actually type place names:
 * case, surrounding punctuation, and the `-`/space drift in "Cox's Bazar",
 * "Coxs Bazar", "cox bazar".
 */
const fold = (s: string) =>
  toWestern(s)
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

/** Split a blob into the units a place name can occupy: lines, then commas. */
const segmentsOf = (line: string) =>
  line
    .split(/[,،|/]+/)
    .map((s) => s.trim())
    .filter(Boolean);

/**
 * A segment names this place when it *is* the name, or contains it as whole
 * words. Substring matching alone is not safe — "Bhola" sits inside other
 * words, and "Dhaka" inside "Dhakain" — so the needle must be word-bounded.
 */
const mentions = (segment: string, place: string): boolean => {
  const hay = fold(segment);
  const needle = fold(place);
  if (!needle) return false;
  if (hay === needle) return true;
  // The dataset's spelling is not always the human one — it stores "Coxsbazar"
  // where a buyer writes "Cox's Bazar". Comparing with spaces removed catches
  // that drift, but ONLY as whole-segment equality: allowing it as a substring
  // would let "Bhola" match inside "Bholanath Road" with no boundary to stop it.
  const squash = (s: string) => s.replace(/ /g, "");
  if (squash(hay) === squash(needle)) return true;
  return new RegExp(`(^| )${needle}( |$)`).test(hay);
};

/**
 * Find the phone.
 *
 * Scans digit runs rather than regex-matching the raw text, because a buyer may
 * write `+880 1712-345678` or `০১৭১২৩৪৫৬৭৮`. `normalizeBdPhone` — the same
 * function the checkout and the server use — decides what counts, so there is
 * exactly one definition of a valid BD mobile in the codebase.
 */
const findPhone = (text: string): { phone?: string; matched?: string } => {
  const western = toWestern(text);
  // 10–14 digits, allowing separators inside, so "+880 1712-345678" survives.
  const candidates = western.match(/\+?\d[\d\s-]{8,16}\d/g) ?? [];
  for (const candidate of candidates) {
    const phone = normalizeBdPhone(candidate);
    if (phone) return { phone, matched: candidate };
  }
  return {};
};

export function parseBdAddress(raw: string): ParsedBdAddress {
  const text = (raw ?? "").trim();
  if (!text) return {};

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const { phone, matched } = findPhone(text);

  // District: search every comma-separated segment of every line, in reverse.
  // BD addresses run narrow → wide ("house, road, area, district"), so the last
  // match is the district and an earlier one is far more likely to be an area
  // that shares a name with a district — Comilla, Bogura and Rangpur all name
  // both a district and a town inside it.
  let district: string | undefined;
  let districtSegment: string | undefined;
  const allSegments = lines.flatMap((line) =>
    segmentsOf(line).map((segment) => ({ line, segment })),
  );
  for (const { segment } of [...allSegments].reverse()) {
    const hit = BD_DISTRICTS.find(
      (d) => mentions(segment, d.name) || mentions(segment, d.bn),
    );
    if (hit) {
      district = hit.name;
      districtSegment = segment;
      break;
    }
  }

  // Area: only once the district is known, and only from that district's own
  // suggestion set. Searching every district's areas would match a common name
  // in the wrong district and produce a confidently wrong prefill.
  let area: string | undefined;
  let areaSegment: string | undefined;
  if (district) {
    const options = upazilasOf(district);
    for (const { segment } of allSegments) {
      if (segment === districtSegment) continue;
      const hit = options.find(
        (u) => mentions(segment, u.name) || mentions(segment, u.bn),
      );
      if (hit) {
        area = hit.name;
        areaSegment = segment;
        break;
      }
    }
  }

  // Name: the first line carrying no digits and naming no place. Buyers put it
  // first, but not always — a line with a phone or a district is never a name.
  const name = lines.find((line) => {
    if (/\d|[০-৯]/.test(line)) return false;
    const segments = segmentsOf(line);
    if (segments.some((s) => s === districtSegment || s === areaSegment)) return false;
    // A bare "Dhaka" line is a place, not a person, even with no comma.
    if (district && (mentions(line, district) || mentions(line, "dhaka"))) return false;
    return true;
  });

  // Address: whatever is left. The phone is stripped in place rather than by
  // dropping its line — buyers often write "01712345678, Dhanmondi" on one line,
  // and dropping it would throw the street away with it.
  const addressParts: string[] = [];
  for (const line of lines) {
    if (line === name) continue;
    const kept = segmentsOf(line)
      .filter((s) => s !== districtSegment && s !== areaSegment)
      .map((s) => (matched ? s.replace(matched.trim(), "").trim() : s))
      .filter((s) => s && !/^[\p{P}\s]+$/u.test(s));
    if (kept.length) addressParts.push(kept.join(", "));
  }
  const address = addressParts.join(", ").trim() || undefined;

  return { name, phone, district, area, address };
}
