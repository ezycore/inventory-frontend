"use client";
// coding-standard: maintained

import { X } from "lucide-react";
import { useStorefrontPage } from "@/services/api";
import { Button } from "@/ui/components/button";

/**
 * The order list narrowed to one landing page — reached from the Orders count on
 * Online Store → Pages, never chosen from a dropdown: a store can hold hundreds
 * of landing pages, and nobody wants to pick one from a list here.
 */
export function LandingPageFilter({ pageId, onClear }: { pageId: string; onClear: () => void }) {
  const { data: page } = useStorefrontPage(pageId);
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm">
      <span className="text-muted-foreground">From landing page</span>
      <span className="font-medium">{page?.title ?? "…"}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        aria-label="Show orders from every page"
        title="Show orders from every page"
        onClick={onClear}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
