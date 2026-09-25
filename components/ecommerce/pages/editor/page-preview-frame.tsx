"use client";
// coding-standard: maintained

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, RotateCw } from "lucide-react";
import { useStorefrontPreviewToken, type StorefrontPage } from "@/services/api";
import { PREVIEW_BUILDER_PARAM, PREVIEW_TOKEN_PARAM } from "@/lib/storefront-preview";
import { storefrontUrl } from "@/lib/storefront-url";
import {
  PAGE_DRAFT_MESSAGE,
  PAGE_DRAFT_READY,
  PAGE_PREVIEW_CART,
  PAGE_SECTION_FOCUS,
  PAGE_SECTION_SELECT,
} from "@/lib/storefront-builder/page-draft-messages";
import { PreviewSkeleton } from "@/components/ecommerce/customize/preview-skeleton";
import { usePreviewScale } from "@/components/ecommerce/customize/use-preview-scale";
import {
  PreviewCartToggle,
  PreviewDeviceToggle,
  PreviewStage,
  PreviewThemeToggle,
  previewFrameSize,
  previewToolbarButton,
} from "@/components/ecommerce/customize/preview-stage";
import { usePreviewTheme } from "@/components/ecommerce/customize/use-preview-theme";
import { needsBuilderParam } from "./preview-address";
import type { EditorDevice, EditorSection } from "./section-instances";

/**
 * The page as shoppers will see it: the real storefront in an iframe, on the
 * owner-preview page route, with the editor's sections posted in as they change
 * — saved or not (`PageDraftPreview` receives them). Every section is sent,
 * finished or not; an unfinished one simply does not draw, so the preview never
 * waits on a save.
 *
 * A click on a section in the frame selects it here, and the section open in the
 * editor is outlined there.
 */
export function PagePreviewFrame({
  slug,
  address,
  unavailable = "Store address unavailable.",
  chrome,
  sections,
  device,
  onDeviceChange,
  selectedId,
  onSelect,
  cart,
  height = "calc(100vh - 11rem)",
}: {
  slug?: string;
  /** The store address the page is previewed at (`previewAddress`); `null` when it has none yet. */
  address: string | null;
  /** What the pane says in place of a frame when there is no address. */
  unavailable?: string;
  /**
   * The page's header and footer choice. Drawn by the preview route's server
   * layout, not by the draft the editor posts in, so a change to it only shows
   * once the frame loads again — hence its place in the frame's key below.
   */
  chrome: StorefrontPage["chrome"];
  sections: EditorSection[];
  device: EditorDevice;
  onDeviceChange: (device: EditorDevice) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /**
   * The sample-basket switch, supplied only by the two pages that draw the
   * shopper's cart (cart and checkout). Absent everywhere else, so no other page
   * grows a control for a basket it never shows.
   */
  cart?: { filled: boolean; onChange: (filled: boolean) => void };
  height?: string;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Needed on a live shop too: a page's draft is not public.
  const { data: preview, isPending: mintingToken } = useStorefrontPreviewToken();
  const { hostRef, scale, ready, frameHeight } = usePreviewScale(device);
  const { theme, setTheme, postTheme } = usePreviewTheme(frameRef);

  /* The frame stays hidden behind a skeleton until it has asked for the draft
     (`PAGE_DRAFT_READY`) — before that it is blank white, then the SAVED page,
     and only then the merchant's draft. Tracked as "which frame is painted", as
     in Customize's preview: a reload changes the key and re-arms the cover with
     nothing to reset. */
  const frameKey = `${address}#${chrome}#${reloadKey}`;
  const [paintedKey, setPaintedKey] = useState<string | null>(null);
  const painted = paintedKey === frameKey;
  const revealTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Safety net: a frame that loads but never announces itself (the shop's own
  // error page) is revealed anyway rather than left behind the cover.
  const onFrameLoad = useCallback(() => {
    clearTimeout(revealTimer.current);
    revealTimer.current = setTimeout(() => setPaintedKey(frameKey), 1500);
  }, [frameKey]);
  useEffect(() => () => clearTimeout(revealTimer.current), []);

  const post = useCallback((message: unknown) => {
    frameRef.current?.contentWindow?.postMessage(message, "*");
  }, []);
  const sendDraft = useCallback(
    () => post({ type: PAGE_DRAFT_MESSAGE, payload: { sections } }),
    [post, sections],
  );
  const sendFocus = useCallback(
    () => post({ type: PAGE_SECTION_FOCUS, payload: { id: selectedId } }),
    [post, selectedId],
  );
  // Sent from every page, not only the two that offer the switch: the frame's
  // default is the sample, so a page with no `cart` prop says so once and the
  // store cannot be left holding another page's answer.
  const cartFilled = cart?.filled ?? true;
  const sendCart = useCallback(
    () => post({ type: PAGE_PREVIEW_CART, payload: { filled: cartFilled } }),
    [post, cartFilled],
  );

  useEffect(() => {
    sendDraft();
  }, [sendDraft]);

  useEffect(() => {
    sendFocus();
  }, [sendFocus]);

  useEffect(() => {
    sendCart();
  }, [sendCart]);

  // The frame announces itself after every (re)load; only its own messages count.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!frameRef.current || event.source !== frameRef.current.contentWindow) return;
      if (event.data?.type === PAGE_DRAFT_READY) {
        sendDraft();
        sendFocus();
        // A reloaded frame carries no theme override — send it again, or a
        // reload silently drops the preview back to the merchant's own theme.
        postTheme();
        // Same for the sample switch: the frame's store is new, and a merchant
        // who had asked for the empty cart would get the sample back.
        sendCart();
        clearTimeout(revealTimer.current);
        setPaintedKey(frameKey);
      } else if (event.data?.type === PAGE_SECTION_SELECT && typeof event.data.payload?.id === "string") {
        onSelect(event.data.payload.id);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [sendDraft, sendFocus, sendCart, postTheme, onSelect, frameKey]);

  if (!slug || !address) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        {slug ? unavailable : "Store address unavailable."}
      </div>
    );
  }

  const token = preview?.token;
  const pageUrl = `${storefrontUrl(slug)}${address === "/" ? "" : address}`;
  const frameQuery = new URLSearchParams({ preview: "1" });
  // `preview=1` alone is the Customize preview at `/` and at a system route; `builder=1` asks for this page.
  if (needsBuilderParam(address)) frameQuery.set(PREVIEW_BUILDER_PARAM, "1");
  if (token) frameQuery.set(PREVIEW_TOKEN_PARAM, token);
  // No `preview=1`: a tab of its own shows the saved draft and can be browsed.
  const tabUrl = token ? `${pageUrl}?${PREVIEW_TOKEN_PARAM}=${encodeURIComponent(token)}` : pageUrl;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-3 py-2">
        <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">{address}</span>
        <div className="ml-auto flex flex-none items-center gap-1">
          {cart ? <PreviewCartToggle filled={cart.filled} onChange={cart.onChange} /> : null}
          <PreviewDeviceToggle device={device} onChange={onDeviceChange} />
          <PreviewThemeToggle theme={theme} onChange={setTheme} />
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            aria-label="Reload preview"
            className={previewToolbarButton}
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <a
            href={tabUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the saved draft in a new tab"
            className={previewToolbarButton}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
      <PreviewStage
        device={device}
        hostRef={hostRef}
        scale={scale}
        height={height}
        overlay={!painted ? <PreviewSkeleton device={device} scale={scale} /> : null}
      >
        {/* Mounted once the preview credential is in hand — before it, an
            unpublished page is a 404 and the frame would have to reload. */}
        {ready && !mintingToken ? (
          <iframe
            key={frameKey}
            ref={frameRef}
            src={`${pageUrl}?${frameQuery}`}
            title="Page preview"
            onLoad={onFrameLoad}
            className="border-0 bg-white"
            // `visibility`, not unmounting: the frame has to load and run to
            // send the ready message that lifts the cover.
            style={{ visibility: painted ? "visible" : "hidden", ...previewFrameSize(device, scale, frameHeight) }}
          />
        ) : null}
      </PreviewStage>
    </div>
  );
}
