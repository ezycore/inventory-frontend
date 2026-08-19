"use client";
// coding-standard: maintained

import { ImagePlus, Info, Loader2, X } from "lucide-react";
import {
  ImageRatioWarning,
  useImageRatioWarning,
} from "@/components/shared/image-ratio-warning";
import type { ImageSize } from "@/lib/image-ratio";
import { Label } from "@/ui/components/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import { cn } from "@/ui/lib/utils";

/**
 * Logo/banner upload tile. The preview IS the upload control — click to add or
 * replace, hover for remove. Uploads save immediately via the media PATCH,
 * independent of the page's Save button; that is the one thing on Customize
 * that still persists on its own, and every hint here says so.
 */
export function MediaField({
  label,
  url,
  inputRef,
  disabled,
  busy,
  onPick,
  onRemove,
  hint,
  recommended,
}: {
  label: string;
  url?: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
  busy: boolean;
  onPick: (file: File) => void;
  onRemove?: () => void;
  hint?: string;
  /**
   * The shape this slot is built for. Supplying it turns on the mismatch
   * warning; leaving it off keeps the field exactly as it was, which is what a
   * slot with no meaningful shape (a favicon, a vector mark) wants.
   */
  recommended?: ImageSize;
}) {
  const ratio = useImageRatioWarning(recommended);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label>{label}</Label>
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info
                className="h-3.5 w-3.5 cursor-help text-muted-foreground"
                aria-label={`About ${label.toLowerCase()}`}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-60">
              {hint}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <div
        className={cn(
          "group relative h-24 overflow-hidden rounded-lg border bg-muted/30",
          !url && "border-dashed",
        )}
      >
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          aria-label={`${url ? "Replace" : "Upload"} ${label.toLowerCase()}`}
          className="flex h-full w-full cursor-pointer items-center justify-center disabled:cursor-not-allowed"
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} className="h-full w-full object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-1.5 text-muted-foreground transition-colors group-hover:text-foreground">
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs font-medium">
                Upload {label.toLowerCase()}
              </span>
            </span>
          )}
        </button>
        {url && !busy && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="flex items-center gap-1.5 text-xs font-medium text-white">
              <ImagePlus className="h-3.5 w-3.5" /> Replace
            </span>
          </span>
        )}
        {url && onRemove && !busy && (
          <button
            type="button"
            onClick={() => {
              ratio.clear();
              onRemove?.();
            }}
            disabled={disabled}
            aria-label={`Remove ${label.toLowerCase()}`}
            className="absolute right-1.5 top-1.5 rounded-md border bg-background/95 p-1 text-muted-foreground shadow-sm transition-colors hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </span>
        )}
      </div>
      <ImageRatioWarning message={ratio.warning} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            void ratio.check(file);
            onPick(file);
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}
