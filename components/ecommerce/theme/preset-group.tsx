"use client";
// coding-standard: maintained

import { Check } from "lucide-react";
import { THEME_PRESETS } from "@/lib/storefront-theme";
import { cn } from "@/ui/lib/utils";

/**
 * Preset picker as mini storefront previews (header bar + copy lines + CTA in
 * the preset's real colors) so presets are judged as a look, not a name.
 */
export function PresetTiles({
  preset,
  onPick,
}: {
  preset: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {THEME_PRESETS.map((p) => {
        const active = preset === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p.id)}
            className={cn(
              "rounded-lg border p-1 text-left transition-colors",
              active
                ? "border-primary ring-2 ring-primary/30"
                : "hover:border-border hover:bg-muted/40",
            )}
          >
            <span className="block overflow-hidden rounded-md border">
              <span
                className="flex h-3.5 items-center justify-end px-1.5"
                style={{ background: p.brandColor }}
              >
                <span className="h-[3px] w-2 rounded-full bg-white/55" />
              </span>
              <span className="flex flex-col gap-[3px] bg-muted/50 p-1.5">
                <span className="block h-[3.5px] w-3/4 rounded-full bg-border" />
                <span className="block h-[3.5px] w-1/2 rounded-full bg-border" />
                <span
                  className="mt-0.5 block h-2 w-6 rounded-sm"
                  style={{ background: p.accentColor }}
                />
              </span>
            </span>
            <span className="flex items-center justify-between px-1 pb-0.5 pt-1.5 text-[11.5px] font-medium">
              {p.label}
              {active && (
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
