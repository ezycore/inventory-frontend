"use client";
// coding-standard: maintained

import { Loader2 } from "lucide-react";
import { cn } from "@/ui/lib/utils";
import { phoneShellSize, type PreviewDevice } from "./preview-stage";

const BLOCK = "rounded-md bg-muted";

/**
 * The cover drawn over a storefront preview while its frame loads — the shape
 * of a shop (header, banner, a row of products) rather than an empty white box.
 *
 * The frame takes a few seconds to arrive: the preview credential is minted,
 * then the shop is server-rendered and hydrated, and only then does it ask for
 * the draft. A blank pane for that long reads as broken; an outline of the page
 * about to appear reads as loading. It sits in the same place and bezel the frame
 * will, so nothing jumps when it is lifted.
 *
 * Shared by both previews — Customize (`browser-preview.tsx`) and the page
 * editor (`page-preview-frame.tsx`).
 */
export function PreviewSkeleton({
  device,
  scale = 1,
  label = "Loading your page…",
}: {
  device: PreviewDevice;
  /** The phone's scale, so the cover is the size of the shell it stands in for. */
  scale?: number;
  label?: string;
}) {
  const mobile = device === "mobile";

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-0 flex justify-center bg-muted/20"
    >
      <div
        aria-hidden
        className={cn(
          "flex flex-none flex-col overflow-hidden bg-card motion-safe:animate-pulse",
          mobile
            ? "my-5 gap-4 rounded-[2.2rem] border-[10px] border-neutral-800 p-4 shadow-2xl"
            : "h-full w-full gap-6 p-6",
        )}
        style={mobile ? phoneShellSize(scale) : undefined}
      >
        <div className="flex items-center gap-3">
          <div className={cn(BLOCK, "h-7 w-24")} />
          {mobile ? null : (
            <div className="ml-6 flex gap-4">
              <div className={cn(BLOCK, "h-3 w-14")} />
              <div className={cn(BLOCK, "h-3 w-16")} />
              <div className={cn(BLOCK, "h-3 w-12")} />
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <div className={cn(BLOCK, "h-7 w-7 rounded-full")} />
            <div className={cn(BLOCK, "h-7 w-7 rounded-full")} />
          </div>
        </div>

        <div className={cn("rounded-xl bg-muted", mobile ? "h-44" : "h-56")} />

        <div className="space-y-2">
          <div className={cn(BLOCK, "h-4 w-40")} />
          <div className={cn(BLOCK, "h-3 w-64 max-w-full")} />
        </div>

        <div className={cn("grid gap-4", mobile ? "grid-cols-2" : "grid-cols-4")}>
          {Array.from({ length: mobile ? 4 : 8 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-square rounded-lg bg-muted" />
              <div className={cn(BLOCK, "h-3 w-4/5")} />
              <div className={cn(BLOCK, "h-3 w-1/3")} />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-background/95 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
        <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden />
        {label}
      </div>
    </div>
  );
}
