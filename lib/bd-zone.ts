// coding-standard: maintained
import { BD_DISTRICTS } from "@/lib/bd-geo";
import { METRO_AREAS } from "@/lib/bd-metro-areas";
import { zoneForDistrict, type Zone } from "@/lib/storefront-shipping";

/**
 * Infer a delivery zone from ONE free-text address — the flat address mode.
 *
 * **A literal port of the backend's `src/utils/bd-zone.ts`, and the backend is
 * authoritative.** This copy exists so checkout can show the zone and its fee as
 * the shopper types, without a round-trip per keystroke. The server re-derives it
 * at `placeOrder` and its answer is the one charged, so a drift between the two
 * shows up as the total changing at the last step — keep them identical, and keep
 * the shared geo data identical too (`bd-geo-mirror.test.ts` guards the data).
 *
 * Detailed mode does not use this at all: there the shopper picks a district and
 * `zoneForDistrict` is exact.
 */
export type ZoneConfidence = "high" | "ambiguous";

export interface ZoneInference {
  zone: Zone;
  confidence: ZoneConfidence;
  /** The place name the answer rests on — shown so the charge is never unexplained. */
  matched?: string;
  district?: string;
}

interface Token {
  name: string;
  district: string;
  metro: boolean;
}

/**
 * Names two districts claim, so neither reading can be trusted on its own.
 * Measured against the real data: of Dhaka's 48 metro thanas exactly two collide
 * with an upazila elsewhere, and two district names double as upazila names.
 */
const AMBIGUOUS_NAMES = new Set(["mirpur", "mohammadpur", "faridpur", "sherpur"]);

/**
 * `\p{M}` is kept deliberately: Bangla vowel signs are combining MARKS, not
 * letters, so a letters-and-digits filter shreds "ঢাকা" into "ঢ ক".
 */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Longest first, so "dhaka cantonment" is tested before "dhaka". */
const TOKENS: Token[] = (() => {
  const tokens: Token[] = [];
  const push = (name: string, district: string, metro: boolean) => {
    const key = normalize(name);
    if (key) tokens.push({ name: key, district, metro });
  };
  for (const district of BD_DISTRICTS) {
    push(district.name, district.name, false);
    push(district.bn, district.name, false);
    for (const upazila of district.upazilas) {
      push(upazila.name, district.name, false);
      push(upazila.bn, district.name, false);
    }
  }
  for (const [district, areas] of Object.entries(METRO_AREAS)) {
    for (const area of areas) {
      push(area.name, district, true);
      push(area.bn, district, true);
    }
  }
  return tokens.sort((a, b) => b.name.length - a.name.length);
})();

/** Whole-word containment, so "savar" does not match inside "savarkar". */
function positionOf(haystack: string, needle: string): number {
  const at = haystack.indexOf(needle);
  if (at < 0) return -1;
  const before = at === 0 ? " " : haystack[at - 1];
  const afterAt = at + needle.length;
  const after = afterAt >= haystack.length ? " " : haystack[afterAt];
  const wordChar = /[\p{L}\p{N}\p{M}]/u;
  return wordChar.test(before) || wordChar.test(after) ? -1 : at;
}

/**
 * The LAST place name in the string decides. Bangladeshi addresses are written
 * most-specific first and end with the district, which is what stops
 * "Dhaka Road, Tangail" reading as inside-Dhaka.
 */
export function inferZone(address: string | undefined | null): ZoneInference {
  const haystack = normalize(address ?? "");
  if (!haystack) return { zone: "outside", confidence: "ambiguous" };

  let best: { token: Token; at: number } | undefined;
  for (const token of TOKENS) {
    const at = positionOf(haystack, token.name);
    if (at < 0) continue;
    if (!best || at > best.at || (at === best.at && token.metro && !best.token.metro)) {
      best = { token, at };
    }
  }
  if (!best) return { zone: "outside", confidence: "ambiguous" };

  const { district, name } = best.token;
  if (AMBIGUOUS_NAMES.has(name)) {
    return { zone: zoneForDistrict(district), confidence: "ambiguous", matched: name };
  }
  return { zone: zoneForDistrict(district), confidence: "high", matched: name, district };
}
