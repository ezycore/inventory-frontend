"use client";
// coding-standard: maintained

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Monitor, RotateCw, Smartphone } from "lucide-react";
import { useStoreProducts } from "@/services/storefront/hooks";
import { storefrontUrl } from "@/lib/storefront-url";
import type { Image } from "@/types";
import { cn } from "@/ui/lib/utils";
import { toPreviewPayload } from "@/components/ecommerce/customize/draft-payloads";
import type { CustomizeDraft } from "@/components/ecommerce/customize/use-customize-draft";

/** Which storefront page the preview is pointed at. */
export type PreviewPage = "home" | "collection" | "product";

const PAGES: { id: PreviewPage; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "collection", label: "Collection" },
  { id: "product", label: "Product" },
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
  draft,
  logo,
  banner,
  page,
  onPageChange,
  /** Force the preview to show slides / collections while their panel is open. */
  forceHeroSlides,
  forceCollectionsMenu,
  socialWhatsapp,
}: {
  slug?: string;
  draft: CustomizeDraft;
  /** Effective (org-fallback applied) images; `null` = none, and must stay null. */
  logo: Image | null;
  banner: Image | null;
  page: PreviewPage;
  onPageChange: (page: PreviewPage) => void;
  forceHeroSlides: boolean;
  forceCollectionsMenu: boolean;
  /** Settings → General number, so the preview mirrors the blank-number fallback. */
  socialWhatsapp?: string;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [reloadKey, setReloadKey] = useState(0);

  // One listed product is enough to preview the product page; without one the
  // tab is disabled rather than opening a 404.
  //
  // This asks the PUBLIC storefront endpoint, not the admin catalog: the admin
  // DTO only carries `storefront.slug` when an owner has typed a custom one, so
  // a normal store returns nothing and the tab would never enable. The public
  // payload always carries the resolved slug — it is the one the shop links to.
  const { data: storeProducts } = useStoreProducts(slug ?? "", { limit: 1 }, !!slug);
  const productSlug = storeProducts?.items?.[0]?.slug;

  const path =
    page === "collection"
      ? "/products"
      : page === "product" && productSlug
        ? `/products/${productSlug}`
        : "";
  const url = slug ? `${storefrontUrl(slug)}${path}?preview=1` : "";

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
      }),
    [draft, logo, banner, forceHeroSlides, forceCollectionsMenu, socialWhatsapp],
  );

  const post = useCallback(() => {
    ref.current?.contentWindow?.postMessage(
      { type: "ezycore-preview", payload },
      "*",
    );
  }, [payload]);

  // Push the draft whenever it changes…
  useEffect(() => {
    post();
  }, [post]);

  // …and whenever the storefront (re)loads and announces it's ready.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "ezycore-preview-ready") post();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [post]);

  if (!slug) {
    return (
      <div className="rounded-xl border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Store URL unavailable.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b bg-muted/50 px-3 py-2">
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
          <div className="flex rounded-md border p-0.5">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              aria-label="Desktop view"
              aria-pressed={device === "desktop"}
              className={cn(
                "rounded p-1.5 transition-colors",
                device === "desktop"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Monitor className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              aria-label="Mobile view"
              aria-pressed={device === "mobile"}
              className={cn(
                "rounded p-1.5 transition-colors",
                device === "mobile"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Smartphone className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            aria-label="Reload preview"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open this page in a new tab"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Viewport — switching device only resizes the same iframe (no reload) */}
      <div
        className="flex justify-center overflow-auto bg-muted/20"
        style={{ height: "calc(100vh - 11rem)", minHeight: 560 }}
      >
        <div
          className={cn(
            "flex-none overflow-hidden bg-white",
            device === "mobile"
              ? "my-5 h-[calc(100%-2.5rem)] w-[390px] rounded-[2.2rem] border-[10px] border-neutral-800 shadow-2xl"
              : "h-full w-full",
          )}
        >
          <iframe
            key={reloadKey}
            ref={ref}
            src={url}
            title="Storefront preview"
            onLoad={post}
            className="h-full w-full border-0 bg-white"
          />
        </div>
      </div>
    </div>
  );
}
