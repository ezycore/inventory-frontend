"use client";
// coding-standard: maintained

import { useEffect } from "react";
import { captureVisitSource } from "@/lib/storefront-attribution";

/**
 * Remembers where this visit came from, for the order it may end in. Renders
 * nothing.
 *
 * Mounted two ways on purpose: in both shop frames with no page, so the ad tags
 * on any link the shopper arrives through are kept; and through the island map
 * on a landing page, with that page's id. The capture merges, so the order the
 * two effects run in does not matter. See `lib/storefront-attribution.ts`.
 */
export function VisitSourceCapture({ pageId }: { pageId?: string }) {
  useEffect(() => {
    captureVisitSource(pageId);
  }, [pageId]);
  return null;
}
