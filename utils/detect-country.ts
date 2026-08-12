// coding-standard: maintained

import { COUNTRY_DATA, type CountryCode } from "@/constants/organization-options";

/**
 * Browser-only guess at which of our supported countries the visitor is in.
 *
 * Deliberately not a geo-IP lookup: signup is the first screen anyone sees, and
 * blocking it on a third-party request (or shipping the visitor's IP to one)
 * buys nothing a timezone already tells us. Both signals below are synchronous
 * and local.
 *
 * The result is a *default*, never a decision — the country field stays
 * editable, and everything derived from it (timezone, currency) re-derives when
 * the user changes it.
 */

/**
 * IANA zones → the country they belong to, for the countries we offer.
 *
 * Only zones that resolve to a supported country are listed; a visitor in
 * Lagos or Lima gets no default rather than a wrong one. Several zones per
 * country, because `resolvedOptions().timeZone` returns wherever the machine
 * actually is — a Dhaka merchant is `Asia/Dhaka`, but a US signup is far more
 * likely to be `America/Chicago` than the one zone we store on the country row.
 */
const TIMEZONE_TO_COUNTRY: Record<string, CountryCode> = {
  "Asia/Dhaka": "BD",
  "Asia/Karachi": "PK",
  "Asia/Kolkata": "IN",
  // The pre-1993 spelling. Still what some Android and older ICU builds report.
  "Asia/Calcutta": "IN",
  "Asia/Dubai": "AE",
  "Asia/Singapore": "SG",
  "Asia/Tokyo": "JP",
  "Asia/Shanghai": "CN",
  "Asia/Hong_Kong": "CN",
  "Europe/London": "UK",
  "Europe/Berlin": "DE",
  "Europe/Paris": "FR",
  "America/New_York": "US",
  "America/Detroit": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Phoenix": "US",
  "America/Los_Angeles": "US",
  "America/Anchorage": "US",
  "Pacific/Honolulu": "US",
  "America/Toronto": "CA",
  "America/Winnipeg": "CA",
  "America/Edmonton": "CA",
  "America/Vancouver": "CA",
  "America/Halifax": "CA",
  "America/Sao_Paulo": "BR",
  "America/Fortaleza": "BR",
  "America/Manaus": "BR",
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Adelaide": "AU",
  "Australia/Perth": "AU",
};

/**
 * ISO 3166 region codes that differ from the value we store on the country row.
 * Our list predates this helper and uses "UK", which is not an ISO region.
 */
const REGION_ALIASES: Record<string, CountryCode> = { GB: "UK" };

const SUPPORTED_CODES = new Set<string>(COUNTRY_DATA.map((c) => c.value));

function asSupportedCode(value: string | undefined): CountryCode | null {
  if (!value) return null;
  const code = REGION_ALIASES[value] ?? value;
  return SUPPORTED_CODES.has(code) ? (code as CountryCode) : null;
}

/** The device's IANA timezone, or null where `Intl` is unavailable/throws. */
function currentTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * The region subtag of the browser's preferred language (`bn-BD` → `BD`).
 *
 * The weaker of the two signals and used only as a fallback: a bare `en` or
 * `bn` carries no region, and a Bangladeshi phone left on `en-US` reports the
 * wrong one. Timezone reflects where the device *is*; language reflects how it
 * was configured.
 */
function localeRegion(): string | undefined {
  if (typeof navigator === "undefined") return undefined;
  for (const tag of navigator.languages ?? [navigator.language]) {
    if (!tag) continue;
    try {
      const region = new Intl.Locale(tag).region;
      if (region) return region;
    } catch {
      // Malformed tag — try the next one.
    }
  }
  return undefined;
}

/**
 * Best guess at the visitor's country as one of `COUNTRY_DATA`'s codes, or
 * `null` when neither signal names a country we support.
 *
 * Client-side only — returns `null` during SSR, so callers must run it in an
 * effect rather than at render time (a server/client mismatch here would be a
 * hydration error).
 */
export function detectCountryCode(): CountryCode | null {
  if (typeof window === "undefined") return null;

  const zone = currentTimeZone();
  const fromZone = zone ? TIMEZONE_TO_COUNTRY[zone] : undefined;
  if (fromZone) return fromZone;

  return asSupportedCode(localeRegion());
}
