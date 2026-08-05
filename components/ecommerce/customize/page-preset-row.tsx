"use client";
// coding-standard: maintained

import {
  PAGE_PRESETS,
  isPagePresetActive,
  type PagePreset,
  type PagePresetKey,
} from "@/lib/storefront-page-presets";
import { cn } from "@/ui/lib/utils";
import type { CustomizeDraft } from "@/components/ecommerce/customize/use-customize-draft";

/**
 * "Start from" — a page's ready-made layouts, above the individual pickers that
 * spell it out.
 *
 * The pickers stay: a preset is a shortcut past them, never a replacement. A
 * merchant picks one and then nudges a single setting, at which point nothing is
 * highlighted any more — which is honest, not a bug. That is also why the
 * highlight demands an exact match on every key the preset owns.
 */
export function PagePresetRow({
  pageKey,
  draft,
  onApply,
}: {
  pageKey: PagePresetKey;
  draft: CustomizeDraft;
  onApply: (preset: PagePreset) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {PAGE_PRESETS[pageKey].map((preset) => {
        const active = isPagePresetActive(preset, draft);
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onApply(preset)}
            className={cn(
              "rounded-lg border p-2 text-left transition-colors",
              active
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "hover:border-border hover:bg-muted/40",
            )}
          >
            <span className="block text-[12px] font-medium leading-tight">
              {preset.label}
            </span>
            <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
              {preset.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
