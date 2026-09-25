"use client";
// coding-standard: maintained

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, RotateCw } from "lucide-react";
import { useStoreProducts } from "@/services/storefront/hooks";
import { useStorefrontPreviewToken } from "@/services/api";
import { storefrontUrl } from "@/lib/storefront-url";
import {
  PREVIEW_CLEAR_PARAM,
  PREVIEW_TOKEN_PARAM,
  setStorefrontPreviewToken,
} from "@/lib/storefront-preview";
import type { Image } from "@/types";
import { cn } from "@/ui/lib/utils";
import { toPreviewPayload } from "@/components/ecommerce/customize/draft-payloads";
import type { CustomizeDraft } from "@/components/ecommerce/customize/use-customize-draft";
import {
  PreviewDeviceToggle,
  PreviewStage,
  PreviewThemeToggle,
  previewFrameSize,
  previewToolbarButton,
} from "@/components/ecommerce/customize/preview-stage";
import type { ThemeSample } from "@/lib/storefront-theme-samples";
import { PreviewSkeleton } from "@/components/ecommerce/customize/preview-skeleton";
import { usePreviewScale } from "@/components/ecommerce/customize/use-preview-scale";
import { usePreviewTheme } from "@/components/ecommerce/customize/use-preview-theme";
import { usePreviewWatchdog } from "@/components/ecommerce/customize/use-preview-watchdog";

/** Which storefront page the preview is pointed at. */
export type PreviewPage = "home" | "collection" | "product" | "track";

const PAGES: { id: PreviewPage; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "collection", label: "Collection" },
  { id: "product", label: "Product" },
  /* The order-tracking page. It is the ONLY page the content frame wraps that
     has no page of its own in the builder, so without a tab here the Content &
     tracking part had nothing to point at and opened the home page — a panel of
     four layouts over a preview that shows none of them. */
  { id: "track", label: "Track order" },
];

/**
 * The REAL storefront in an iframe (`?preview=1`), with the unsaved draft
 * streamed in over `postMessage` — the shell reads it from the preview store, so
 * edits repaint instantly without a reload.
 *
 * The page switcher replaced a decorative browser chrome (traffic lights, a
 * padlock and a URL bar that did nothing). It is not cosmetic: the preview was
 * pinned to the home page, so the collection, pagination and product-page
 * settings changed nothing on screen and read as broken controls.
 *
 * Checkout still has no tab — it needs items in a cart, and an empty-cart screen
 * would tell a merchant nothing about a layout they just chose.
 */
export function BrowserPreview({
  slug,
  published,
  draft,
  logo,
  banner,
  mobileLogo = null,
  page,
  onPageChange,
  /** Force the preview to show slides / collections while their panel is open. */
  forceHeroSlides,
  forceCollectionsMenu,
  socialWhatsapp,
  hasCollections = true,
  samples,
  viewportHeight = "calc(100vh - 11rem)",
  deviceRequest,
}: {
  slug?: string;
  /**
   * Whether the shop is live. Drives owner preview: an unpublished shop is a 404
   * to the public API, so previewing one needs a minted token — and a published
   * one must not pay for a token it has no use for.
   */
  published: boolean;
  draft: CustomizeDraft;
  /** Effective (org-fallback applied) images; `null` = none, and must stay null. */
  logo: Image | null;
  banner: Image | null;
  /**
   * The merchant's phone artwork, raw — deliberately NOT resolved to the desktop
   * logo. The storefront owns that fallback, so resolving it here would make
   * removing the image in the editor preview as "nothing changed".
   */
  mobileLogo?: Image | null;
  page: PreviewPage;
  onPageChange: (page: PreviewPage) => void;
  forceHeroSlides: boolean;
  forceCollectionsMenu: boolean;
  /** Settings → General number, so the preview mirrors the blank-number fallback. */
  socialWhatsapp?: string;
  /** False when the caller runs no collections query — see toPreviewPayload. */
  hasCollections?: boolean;
  /** Sample stock for the theme picker — see `toPreviewPayload`. */
  samples?: ThemeSample;
  /**
   * Viewport height. The default fills the Customize page below its header; the
   * theme store's Preview dialog passes its own, because a `100vh`-derived
   * height inside a modal that is itself capped at `90vh` overflows the dialog.
   */
  viewportHeight?: string;
  /**
   * Nudge the frame onto a device when the merchant opens a part that only
   * exists there — the Phone bar panel is the case, and its controls change
   * nothing visible while the preview is showing a desktop.
   *
   * A NUDGE, not a lock: the toggle stays live afterwards, so a merchant who
   * wants to see how their phone choices leave the desktop can just switch back
   * and stay there. Keyed by an incrementing token rather than a bare value so
   * re-opening the same part nudges again, while an unrelated re-render does not
   * yank the frame back out from under someone who has switched.
   */
  deviceRequest?: { device: "desktop" | "mobile"; token: number };
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  /* The last nudge this frame has acted on.

     `-1`, not `0`, and that is the whole of a shipped bug: the workspace mints
     its FIRST request as `token: 0`, so a marker starting at `0` read the
     opening request as one it had already applied. Clicking the Phone bar row
     worked (that increments to 1) while `?part=mobile` — the documented deep
     link, and what a reload restores — silently left the merchant on the desktop
     frame, looking at a panel of controls that change nothing on screen. No
     token is ever negative, so this cannot collide with a real one.

     ⚠ **State, not a ref, and the difference is not stylistic.** This is React's
     documented "adjust state when a prop changes" escape hatch: a `set` called
     during render re-runs this component before it commits, so the phone frame
     is the first thing painted. A ref did the same job and was the thing the
     React Compiler rejects outright (`react-hooks/refs`, an ERROR — reading or
     writing `.current` during render is how a component silently fails to
     update). An effect is the other obvious move and is the one behaviour we
     cannot have: it paints the desktop frame, commits, then swaps — a visible
     flicker on the panel whose entire job is to show the phone. */
  const [appliedRequest, setAppliedRequest] = useState(-1);
  if (deviceRequest && deviceRequest.token !== appliedRequest) {
    setAppliedRequest(deviceRequest.token);
    if (deviceRequest.device !== device) setDevice(deviceRequest.device);
  }
  const { hostRef, scale, ready, frameHeight } = usePreviewScale(device);
  const { theme, setTheme, postTheme } = usePreviewTheme(ref);
  const [reloadKey, setReloadKey] = useState(0);

  /* ── Owner preview ───────────────────────────────────────────────────────
     Before this, everything below was a 404 until the merchant published: the
     preview iframes the REAL storefront, and the public API does not serve an
     unpublished shop. So "set the shop up properly, then go live" meant going
     live first and theming in front of shoppers. See `lib/storefront-preview.ts`. */
  const { data: preview, isPending: mintingToken } =
    useStorefrontPreviewToken(!published);

  /* Registered during RENDER rather than in an effect, and ABOVE the query that
     needs it. `useStoreProducts` queues its fetch from its own effect, which — as
     the earlier hook — runs first in the same commit; a token published from an
     effect down here would always arrive one request too late.

     No unmount cleanup on purpose. It looked like hygiene and was a dev-only
     bug: StrictMode mounts, tears down and remounts effects with NO render in
     between, so the teardown cleared a token this render had just published and
     nothing re-published it. This line is the only writer and it runs every
     render, which is what makes the value correct; one left behind after the
     editor closes is inert — `sfFetch` on the admin origin is only reached from
     these editors, and the API ignores a token for a shop that is published. */
  setStorefrontPreviewToken(published ? null : (preview?.token ?? null));

  /* Don't ask about products until we know whether we may. Firing early against
     an unpublished shop caches the 404, and the answer arriving afterwards would
     not re-run it — leaving the Product tab permanently disabled on exactly the
     shops this feature exists for. */
  const previewReady = published || !mintingToken;

  // One listed product is enough to preview the product page; without one the
  // tab is disabled rather than opening a 404.
  //
  // This asks the PUBLIC storefront endpoint, not the admin catalog: the admin
  // DTO only carries `storefront.slug` when an owner has typed a custom one, so
  // a normal store returns nothing and the tab would never enable. The public
  // payload always carries the resolved slug — it is the one the shop links to.
  const { data: storeProducts } = useStoreProducts(
    slug ?? "",
    { limit: 1 },
    !!slug && previewReady,
  );
  const productSlug = storeProducts?.items?.[0]?.slug;

  const path =
    page === "collection"
      ? "/products"
      : page === "track"
        ? "/orders/track"
        : page === "product" && productSlug
          ? `/products/${productSlug}`
          : "";
  // `preview=1` turns on the draft bridge inside the frame; the token is what
  // gets the frame served at all before the shop is published. The token also
  // makes the "open in a new tab" link beside it work pre-launch, which is the
  // only way to see the shop at full size before going live.
  const params = new URLSearchParams({ preview: "1" });
  if (preview?.token) params.set(PREVIEW_TOKEN_PARAM, preview.token);
  // Published shops mint no token, so the frame no longer needs one — and the
  // cookie a PREVIOUS session left on the shop's host is now pure overhead that
  // would otherwise sit there for up to four hours. This is the only request the
  // admin makes to that origin, so it is the only chance to ask it to forget.
  if (published) params.set(PREVIEW_CLEAR_PARAM, "1");
  const url = slug ? `${storefrontUrl(slug)}${path}?${params}` : "";

  // Built by the same module as the save payload, so the preview cannot promise
  // a footer column or a slide the save path would drop. Memoised so the post
  // callback's identity only changes on a real edit.
  const payload = useMemo(
    () =>
      toPreviewPayload(draft, {
        logo,
        banner,
        forceHeroSlides,
        forceCollectionsMenu,
        socialWhatsapp,
        hasCollections,
        samples,
        mobileLogo,
      }),
    [
      draft,
      logo,
      banner,
      mobileLogo,
      forceHeroSlides,
      forceCollectionsMenu,
      socialWhatsapp,
      hasCollections,
      samples,
    ],
  );

  /* **The frame stays hidden until the draft has actually landed in it.**
     It server-renders the merchant's SAVED store, paints that, and only then
     runs ready → post → apply — so previewing a theme flashed the
     currently-active one first, every time, and switching the preview page in
     Customize did the same because that reloads the frame too.

     Tracked as "which frame has been painted" rather than a boolean reset in an
     effect: the identity of the loaded frame IS the state, so a reload re-arms
     the cover by simply not matching, with nothing to reset and no render blink
     on an ordinary draft edit. */
  const frameKey = `${url}#${reloadKey}`;
  const [paintedKey, setPaintedKey] = useState<string | null>(null);
  const painted = paintedKey === frameKey;

  /* Reload a frame that has stopped acknowledging the drafts we post it — see
     the hook for what that state looks like on screen and why it is armed only
     after the first apply. `payload` is the signal because it is exactly "an
     edit happened": it is memoised above and re-made only on a real change. */
  const { markPosted, markAcked } = usePreviewWatchdog({
    armed: painted,
    signal: payload,
    onStale: useCallback(() => setReloadKey((k) => k + 1), []),
  });

  const post = useCallback(() => {
    markPosted();
    ref.current?.contentWindow?.postMessage(
      { type: "ezycore-preview", payload: { ...payload, previewDevice: device } },
      "*",
    );
  }, [payload, device, markPosted]);

  /* Re-arm the cover on the frame's OWN load event, not just on the reloads the
     editor asks for.
     `frameKey` only moves when the editor changes the page or bumps
     `reloadKey`, so it covers exactly the reloads the editor causes. A frame can
     also reload without being asked — a link followed inside it, the shop's own
     redirect, a dev Fast Refresh — and every one of those keeps the same `url`
     and `reloadKey`. `paintedKey` then still matches, the cover stays lifted,
     and the merchant watches the SAVED store paint before the draft lands on
     top of it: a setting they just switched off appears, then vanishes.
     The `load` event is the one signal that fires for all of them. Clearing on
     the first load is a no-op (nothing is painted yet), and clearing hands the
     1.5s safety net and the watchdog back their un-painted state, so a frame
     that never acks is still revealed rather than stranded blank. */
  const onFrameLoad = useCallback(() => {
    setPaintedKey(null);
    post();
  }, [post]);

  // Push the draft whenever it changes…
  useEffect(() => {
    post();
  }, [post]);

  // …and whenever the storefront (re)loads and announces it's ready.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "ezycore-preview-ready") {
        post();
        // The theme override does not survive the frame's (re)load — switching
        // preview page reloads it, and without this the frame comes back in the
        // merchant's own theme while the toggle still says the other one.
        postTheme();
      }
      if (e.data?.type === "ezycore-preview-applied") {
        markAcked();
        setPaintedKey(frameKey);
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [post, postTheme, frameKey, markAcked]);

  /* Safety net. If the ack never arrives — an older storefront build, a frame
     that failed to boot, `preview=1` stripped by a redirect — the preview must
     still appear. A moment of the saved theme is a blemish; a permanently blank
     preview is a broken page. */
  useEffect(() => {
    // `previewReady` guards it too: on an unpublished shop the frame is not
    // mounted until the token is in hand, and revealing a frame that does not
    // exist yet shows a blank panel rather than a late one.
    if (painted || !previewReady) return;
    const t = setTimeout(() => setPaintedKey(frameKey), 1500);
    return () => clearTimeout(t);
  }, [painted, frameKey, previewReady]);


  if (!slug) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Store URL unavailable.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Wraps rather than clips: the page tabs and the device/reload/open
          cluster together are wider than a phone viewport, and the card's
          `overflow-hidden` would swallow whichever end lost. */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-3 py-2">
        <div
          role="tablist"
          aria-label="Preview page"
          className="flex gap-1 rounded-lg border bg-background p-0.5"
        >
          {PAGES.map((p) => {
            const disabled = p.id === "product" && !productSlug;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={page === p.id}
                disabled={disabled}
                title={
                  disabled
                    ? "List a product online to preview its page"
                    : undefined
                }
                onClick={() => onPageChange(p.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40",
                  page === p.id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="ml-auto flex flex-none items-center gap-1">
          <PreviewDeviceToggle device={device} onChange={setDevice} />
          <PreviewThemeToggle theme={theme} onChange={setTheme} />
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            aria-label="Reload preview"
            className={previewToolbarButton}
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open this page in a new tab"
            className={previewToolbarButton}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Viewport — switching device only resizes the same iframe (no reload) */}
      <PreviewStage
        device={device}
        hostRef={hostRef}
        scale={scale}
        height={viewportHeight}
        overlay={!painted ? <PreviewSkeleton device={device} scale={scale} label="Loading preview…" /> : null}
      >
        {/* `visibility`, not conditional mounting: the frame has to load and
            run to send the ack that reveals it. Opacity alone would still let
            the saved theme paint through the transition. Its size per device —
            and why desktop uses `zoom` — is `previewFrameSize`. */}
        {/* `previewReady` as well as `ready`: mounting before the owner-preview
            token is in hand would load the shop's own "not published yet" 404
            and then reload it a moment later — a wasted render of the wrong
            page, and one the 1.5s reveal could catch mid-flight. */}
        {ready && previewReady ? (
          <iframe
            key={reloadKey}
            ref={ref}
            src={url}
            title="Storefront preview"
            onLoad={onFrameLoad}
            className="border-0 bg-white"
            style={{
              visibility: painted ? "visible" : "hidden",
              ...previewFrameSize(device, scale, frameHeight),
            }}
          />
        ) : null}
      </PreviewStage>
    </div>
  );
}
