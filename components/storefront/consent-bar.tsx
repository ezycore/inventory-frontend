"use client";
// coding-standard: maintained

import { useEffect, useRef, useState } from "react";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { useStorePathname } from "@/services/storefront/use-store-pathname";
import { useBottomBarHeight } from "@/components/storefront/use-bottom-bar-height";
import {
  setClarityConsent,
  storefrontPageType,
} from "@/lib/storefront-clarity";

/**
 * The cookie consent bar (backend `docs/plan/storefront-clarity.md` §6).
 *
 * Mounted by `ClarityClient`, so it exists only on a store that actually has Clarity — there is
 * no consent to collect otherwise.
 *
 * **Every rule below is an anti-annoyance rule, and each one is load-bearing:**
 *
 *  - **It is not a modal.** No overlay, no backdrop, no scroll lock, no focus trap. A shopper can
 *    ignore it forever and still buy.
 *  - **It never renders on checkout.** Nothing goes between a shopper and a payment. A shopper
 *    who reaches checkout undecided stays undecided, and the denial already sent stands.
 *  - **It mounts late** — on the first scroll, or after 3s. Appearing during first paint competes
 *    with LCP and reads as an interstitial.
 *  - **Both answers are final.** "No thanks" is a decision, not a dismissal to re-ask later.
 *  - **The decision is remembered in `localStorage`, not a cookie.** Remembering a refusal must
 *    not write the thing being refused. A consent record is strictly-necessary storage.
 *
 * `mode` is the merchant's choice and decides who ever sees this (`ClarityCookieConsent`):
 * `off` never renders it, `eu` shows it only to a shopper on a European clock, `always` to
 * everyone. **`off` is not "no consent handling" and not a promise of no cookies.** Whatever the
 * mode, the effect below sends a denial on every page view; and whatever we send, a Clarity
 * project with its own Cookies switch on will still set `_clck`.
 */

/** One value, one shape: what the shopper answered, or nothing if they have not. */
const STORAGE_KEY = "sf-consent-v1";
type Decision = "granted" | "denied";

const readDecision = (): Decision | null => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    // Private mode, blocked storage, a locked-down browser. Treated as "not asked yet": the bar
    // reappears next visit, which is the honest behaviour when the answer cannot be kept.
    return null;
  }
};

/**
 * Is this shopper somewhere a consent bar is expected?
 *
 * **Timezone, not IP, and deliberately.** The storefront is not proxied through Cloudflare —
 * Caddy terminates TLS and Cloudflare only answers the DNS-01 challenge — so `CF-IPCountry` does
 * not exist on our requests, and country gating would mean shipping a GeoIP database and running
 * a lookup on a hot path.
 *
 * `Europe/*` is strictly wider than the EEA+UK+CH set Clarity's own enforcement targets, and the
 * error it makes is always the safe one: a European travelling in Dhaka still sees the bar; a
 * Bangladeshi shopper never does.
 */
const onEuropeanClock = (): boolean => {
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

export function ConsentBar({ mode }: { mode: "off" | "eu" | "always" }) {
  const { t } = useStorefrontUI();
  const pathname = useStorePathname();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Nothing between a shopper and a payment. Re-evaluated per navigation, so a shopper who
  // leaves checkout can still be asked.
  const onCheckout = storefrontPageType(pathname) === "checkout";

  useBottomBarHeight(ref, visible, "--sf-consent-h");

  useEffect(() => {
    const decided = readDecision();

    // **Sent on every page view, before anything else, and denied unless the shopper said
    // otherwise.** Two jobs in one call. A stored answer is replayed because Clarity's consent
    // state lives in the tag and not in our storage, so a shopper who accepted last week is only
    // recognised if we say so again now. And a *missing* answer is stated as a refusal rather
    // than left silent — see `setClarityConsent`, where the live measurement that forced this
    // is written down. An earlier version returned early for `mode === "off"` and called nothing
    // at all, which left the shopper's state indistinguishable from an un-run effect.
    setClarityConsent(decided === "granted");
    if (decided) return;

    if (mode === "off" || onCheckout) return;
    if (mode === "eu" && !onEuropeanClock()) return;

    // Late by design: whichever of a scroll or 3s comes first. A bar that paints with the hero
    // is an interstitial; one that arrives after the shopper has started reading is furniture.
    const show = () => setVisible(true);
    const timer = window.setTimeout(show, 3000);
    window.addEventListener("scroll", show, { once: true, passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", show);
    };
  }, [mode, onCheckout]);

  if (!visible || onCheckout) return null;

  const answer = (decision: Decision) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, decision);
    } catch {
      // Unstorable answers still apply to this session — they are simply asked again next visit.
    }
    setClarityConsent(decision === "granted");
    setVisible(false);
  };

  return (
    // `role="region"` rather than `dialog`: it is page furniture the shopper may ignore, and a
    // dialog role would promise a focus trap that deliberately is not here.
    <div className="sf-consent" role="region" aria-label={t.consentAccept} ref={ref}>
      <p className="sf-consent-text">{t.consentText}</p>
      <div className="sf-consent-actions">
        {/* Equal visual weight on purpose. A greyed-out refusal beside a bright accept is the
            dark pattern this bar exists to not be. */}
        <button type="button" className="sf-consent-btn" onClick={() => answer("denied")}>
          {t.consentDecline}
        </button>
        <button
          type="button"
          className="sf-consent-btn sf-consent-btn-primary"
          onClick={() => answer("granted")}
        >
          {t.consentAccept}
        </button>
      </div>
    </div>
  );
}
