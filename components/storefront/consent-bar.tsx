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
import { setGa4Consent } from "@/lib/storefront-ga4";
import {
  onEuropeanClock,
  readConsentDecision,
  writeConsentDecision,
  type ConsentDecision,
} from "@/lib/storefront-consent";

/**
 * The cookie consent bar (backend `docs/plan/storefront-clarity.md` §6, made store-level by
 * `docs/plan/storefront-ga4.md` §5).
 *
 * Mounted by `StoreHead` when a tool that sets cookies is on — Clarity, GA4, or both — and only
 * then: there is no consent to collect otherwise. One question, one answer, forwarded to every
 * tool that is on (`clarity` / `ga4` props).
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
 * `mode` is the merchant's choice (the store-level `cookieBanner`) and decides who ever sees
 * this: `off` never renders it, `eu` shows it only to a shopper on a European clock, `always` to
 * everyone. **`off` is not "no consent handling" and not a promise of no cookies.** For Clarity,
 * whatever the mode, the effect below sends a denial on every page view; and a Clarity project
 * with its own Cookies switch on will still set `_clck`. GA4's default is set before hydration by
 * its boot script from the same mode and stored answer (`ga4DefaultGranted`), so this bar only
 * sends GA4 the shopper's answer when they give one.
 */
export function ConsentBar({
  mode,
  clarity = false,
  ga4 = false,
}: {
  mode: "off" | "eu" | "always";
  /** Clarity is on for this store — forward the answer to it, and deny on every page view. */
  clarity?: boolean;
  /** GA4 is on for this store — forward the answer to it when the shopper gives one. */
  ga4?: boolean;
}) {
  const { t } = useStorefrontUI();
  const pathname = useStorePathname();
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Nothing between a shopper and a payment. Re-evaluated per navigation, so a shopper who
  // leaves checkout can still be asked.
  const onCheckout = storefrontPageType(pathname) === "checkout";

  useBottomBarHeight(ref, visible, "--sf-consent-h");

  useEffect(() => {
    const decided = readConsentDecision();

    // **Sent on every page view, before anything else, and denied unless the shopper said
    // otherwise.** Two jobs in one call. A stored answer is replayed because Clarity's consent
    // state lives in the tag and not in our storage, so a shopper who accepted last week is only
    // recognised if we say so again now. And a *missing* answer is stated as a refusal rather
    // than left silent — see `setClarityConsent`, where the live measurement that forced this
    // is written down. An earlier version returned early for `mode === "off"` and called nothing
    // at all, which left the shopper's state indistinguishable from an un-run effect.
    if (clarity) setClarityConsent(decided === "granted");
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
  }, [mode, onCheckout, clarity]);

  if (!visible || onCheckout) return null;

  const answer = (decision: ConsentDecision) => {
    writeConsentDecision(decision);
    if (clarity) setClarityConsent(decision === "granted");
    if (ga4) setGa4Consent(decision === "granted");
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
