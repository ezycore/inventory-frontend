"use client";
// coding-standard: maintained

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, RotateCw } from "lucide-react";
import { useStorefrontPreviewToken } from "@/services/api";
import { PREVIEW_BUILDER_PARAM, PREVIEW_TOKEN_PARAM } from "@/lib/storefront-preview";
import { storefrontUrl } from "@/lib/storefront-url";
import {
  PAGE_DRAFT_MESSAGE,
  PAGE_DRAFT_READY,
  PAGE_SECTION_FOCUS,
  PAGE_SECTION_SELECT,
} from "@/lib/storefront-builder/page-draft-messages";
import { usePreviewScale } from "@/components/ecommerce/customize/use-preview-scale";
import {
  PreviewDeviceToggle,
  PreviewStage,
  previewFrameSize,
} from "@/components/ecommerce/customize/preview-stage";
import { needsBuilderParam } from "./preview-address";
import type { EditorDevice, EditorSection } from "./section-instances";

const toolbarButton =
  "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

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
  sections,
  device,
  onDeviceChange,
  selectedId,
  onSelect,
  height = "calc(100vh - 11rem)",
}: {
  slug?: string;
  /** The store address the page is previewed at (`previewAddress`); `null` when it has none yet. */
  address: string | null;
  /** What the pane says in place of a frame when there is no address. */
  unavailable?: string;
  sections: EditorSection[];
  device: EditorDevice;
  onDeviceChange: (device: EditorDevice) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  height?: string;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Needed on a live shop too: a page's draft is not public.
  const { data: preview, isPending: mintingToken } = useStorefrontPreviewToken();
  const { hostRef, scale, ready, frameHeight } = usePreviewScale(device === "desktop");

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

  useEffect(() => {
    sendDraft();
  }, [sendDraft]);

  useEffect(() => {
    sendFocus();
  }, [sendFocus]);

  // The frame announces itself after every (re)load; only its own messages count.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!frameRef.current || event.source !== frameRef.current.contentWindow) return;
      if (event.data?.type === PAGE_DRAFT_READY) {
        sendDraft();
        sendFocus();
      } else if (event.data?.type === PAGE_SECTION_SELECT && typeof event.data.payload?.id === "string") {
        onSelect(event.data.payload.id);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [sendDraft, sendFocus, onSelect]);

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
          <PreviewDeviceToggle device={device} onChange={onDeviceChange} />
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            aria-label="Reload preview"
            className={toolbarButton}
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <a
            href={tabUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the saved draft in a new tab"
            className={toolbarButton}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
      <PreviewStage device={device} hostRef={hostRef} height={height}>
        {/* Mounted once the preview credential is in hand — before it, an
            unpublished page is a 404 and the frame would have to reload. */}
        {ready && !mintingToken ? (
          <iframe
            key={`${address}#${reloadKey}`}
            ref={frameRef}
            src={`${pageUrl}?${frameQuery}`}
            title="Page preview"
            className="border-0 bg-white"
            style={previewFrameSize(device, scale, frameHeight)}
          />
        ) : null}
      </PreviewStage>
    </div>
  );
}
