// coding-standard: maintained

/**
 * The shopper's cookie-consent answer, shared by every tool that sets cookies on the storefront
 * (Clarity, GA4) — backend `docs/plan/storefront-ga4.md` §5.
 *
 * One question, one stored answer. `ConsentBar` writes it; each tool reads it. GA4's inline boot
 * script (`ga4BootScript`) reads the same key before hydration, so its consent default already
 * reflects a returning shopper's answer.
 */

/** Remembered in `localStorage`, not a cookie: remembering a refusal must not write the thing
 *  being refused. A consent record is strictly-necessary storage. */
export const CONSENT_STORAGE_KEY = "sf-consent-v1";

export type ConsentDecision = "granted" | "denied";

/** The stored answer, or `null` when the shopper has not answered (or storage is blocked). */
export const readConsentDecision = (): ConsentDecision | null => {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    // Private mode, blocked storage: treated as "not asked yet". The bar reappears next visit,
    // which is the honest behaviour when the answer cannot be kept.
    return null;
  }
};

export const writeConsentDecision = (decision: ConsentDecision): void => {
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, decision);
  } catch {
    // Unstorable answers still apply to this page — they are simply asked again next visit.
  }
};

/**
 * Is this shopper on a European clock — the `eu` banner mode's test?
 *
 * **Timezone, not IP, and deliberately.** The storefront is not proxied through Cloudflare, so
 * there is no country header, and country gating would mean a GeoIP lookup on a hot path.
 * `Europe/*` is wider than any single legal region, and the error it makes is the safe one: a
 * European travelling in Dhaka still sees the bar.
 */
export const onEuropeanClock = (): boolean => {
  try {
    return (
      Intl.DateTimeFormat().resolvedOptions().timeZone?.startsWith("Europe/") ??
      false
    );
  } catch {
    // A browser that cannot name its zone gets the bar: over-showing is the safe direction.
    return true;
  }
};
