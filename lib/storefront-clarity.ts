// coding-standard: maintained

/**
 * The Microsoft Clarity wrapper — the only place the storefront talks to `window.clarity`.
 *
 * Backend plan: `easystock-backend/docs/plan/storefront-clarity.md`.
 *
 * ## What is deliberately absent
 *
 * **`identify` is never called.** Clarity's identify API would attach a shopper's phone, email or
 * customer id to a recording — inside a project the *merchant* owns and controls the access to.
 * Every other decision in this integration keeps shopper PII out of Clarity; a single
 * `clarity("identify", phone)` would undo all of them, so the call has no wrapper here and
 * should not grow one.
 *
 * ## Everything here fails silently
 *
 * Same contract as `storefront-meta.ts`: an ad blocker is the normal case, not an error. A
 * behaviour-analytics call must never surface an error, break a click, or block a purchase.
 */

/** `window.clarity`, as much of it as we call. */
type Clarity = (...args: unknown[]) => void;

declare global {
  interface Window {
    clarity?: Clarity;
  }
}

/**
 * Call Clarity if it is there.
 *
 * The queue stub in the loader snippet means `window.clarity` exists before the script itself
 * has arrived, so an early call is buffered rather than lost — but an ad blocker removes both,
 * which is why the guard is on every path rather than on the first one only.
 */
const call = (...args: unknown[]): void => {
  try {
    window.clarity?.(...args);
  } catch {
    // Never surface a tracking failure to a shopper.
  }
};

/**
 * Run `fn` once `window.clarity` exists, or give up.
 *
 * The consent call is the one that cannot afford to be dropped. The loader snippet installs a
 * queueing stub synchronously, but it is a `next/script` `afterInteractive` tag, so on a slow
 * first paint an effect can run before it — and a dropped consent call is not a no-op, it is
 * cookies the shopper did not agree to. Retrying costs a handful of timers and removes the race.
 *
 * Bounded rather than open-ended: an ad blocker means `window.clarity` is never coming, and a
 * timer that waits forever for it is a leak in every blocked session.
 */
const whenClarityReady = (fn: () => void, attempt = 0): void => {
  if (typeof window === "undefined") return;
  if (window.clarity) {
    fn();
    return;
  }
  // ~5s in total: 50 tries at 100ms. Longer than any observed hydration, shorter than a session.
  if (attempt >= 50) return;
  window.setTimeout(() => whenClarityReady(fn, attempt + 1), 100);
};

/**
 * Where the shopper is, as a Clarity filter.
 *
 * This is the single highest-value line of the integration: without it a merchant's dashboard is
 * an undifferentiated pile of sessions, and with it they can read "the heatmap of my product
 * pages" — which is the question they actually have. Derived from the pathname rather than
 * passed in by each page, so a new route cannot quietly stop being categorised.
 */
export type StorefrontPageType =
  | "home"
  | "category"
  | "product"
  | "search"
  | "cart"
  | "checkout"
  | "order"
  | "account"
  | "page";

/**
 * Classify a storefront pathname.
 *
 * Takes the path as `useStorePathname` spells it, which is `/shop/...` on a tenant subdomain and
 * `/...` on a custom domain (`siteBaseFor`). **The `/shop` prefix is stripped here rather than by
 * the caller**, so the same store classifies identically on both hosting shapes — a merchant who
 * moves onto their own domain must not see their dashboard's filters reset to one bucket.
 */
export function storefrontPageType(pathname: string): StorefrontPageType {
  const path =
    (pathname === "/shop"
      ? "/"
      : pathname.startsWith("/shop/")
        ? pathname.slice(5)
        : pathname
    ).replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  if (path.startsWith("/products")) return "product";
  if (path.startsWith("/search")) return "search";
  if (path.startsWith("/cart")) return "cart";
  if (path.startsWith("/checkout")) return "checkout";
  // `/t/<token>` is the tokenised order-tracking link; `/orders` is the shopper's own history.
  if (path.startsWith("/orders") || path.startsWith("/t/")) return "order";
  if (path.startsWith("/account")) return "account";
  if (path.startsWith("/pages") || path.startsWith("/campaigns")) return "page";
  // Everything left is the category catch-all (`[...categoryPath]`), which is most of the site.
  return "category";
}

/** Tag the session with where it is, so the merchant's dashboard can filter by it. */
export function setClarityPageType(pageType: StorefrontPageType): void {
  call("set", "page_type", pageType);
}

/**
 * Ask Clarity to keep this session even while the project is being sampled.
 *
 * Clarity retains up to 100k recordings per project per day and samples above that. A merchant
 * who has a good day is exactly the merchant whose checkout recordings matter, so checkout is
 * marked as soon as it is reached.
 */
export function upgradeClaritySession(reason: string): void {
  call("upgrade", reason);
}

/**
 * Pass the shopper's cookie decision to Clarity.
 *
 * `ad_Storage` is **always denied** — Clarity's advertising storage has no role on a storefront,
 * and consent collected for a purpose that does not exist is not consent. Only
 * `analytics_Storage` follows the shopper's answer.
 *
 * **A refusal must be sent explicitly. Silence is not a refusal — measured live on a real
 * project on 2026-09-23.** Microsoft's documentation says Clarity runs cookieless until a
 * `consentv2` call arrives, and the first version of this integration relied on it: `off` mode
 * called nothing at all. A live storefront load then set `_clck` and `_clsk` with no call ever
 * made. So this is called on EVERY page view, before anything else, denied unless the shopper
 * has said otherwise; nothing here may go back to treating an un-made call as a denial.
 *
 * **What it does NOT do is guarantee no cookies, and no code here can.** In the same session
 * `_clck` survived an explicit denial, because cookies are a property of the merchant's own
 * project: Clarity → Settings → Setup → Advanced settings → **Cookies**, which is ON when a
 * project is created. A merchant who wants none turns it off there. The storefront's job is to
 * report the shopper's answer accurately, not to promise an outcome it does not control.
 */
export function setClarityConsent(analyticsGranted: boolean): void {
  whenClarityReady(() =>
    call("consentv2", {
      ad_Storage: "denied",
      analytics_Storage: analyticsGranted ? "granted" : "denied",
    }),
  );
}
