"use client";
// coding-standard: maintained

import { Check } from "lucide-react";
import type { ReadyMadeTheme } from "@/lib/storefront-themes";
import { surfaceSwatch } from "@/lib/storefront-theme";
import { cn } from "@/ui/lib/utils";

/**
 * The theme picker: one row per theme, beside the preview it drives.
 *
 * A row is deliberately small. The old page gave every theme a large card with
 * its own thumbnail and two buttons, which made four equal-weight objects and
 * left the merchant to open each one in turn. Here the row's only job is to be
 * *selected* — the answer to "what does it look like" is the full-size shop
 * rendered next to it, so a row needs to carry just enough to tell two themes
 * apart at a glance and no more.
 *
 * That "just enough" is the theme's own ground and brand, drawn as a two-tone
 * chip. It is the same palette the sketch and the storefront resolve, so a row
 * cannot claim a colour the shop will not use.
 */
export function ThemeList({
  themes,
  selectedId,
  activeId,
  modified,
  onSelect,
}: {
  themes: ReadyMadeTheme[];
  selectedId: string;
  /** The theme the shop is actually running — marked, never auto-selected. */
  activeId?: string;
  /** Active, but the merchant has since changed something the theme set. */
  modified: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      role="listbox"
      aria-label="Themes"
      className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
    >
      {themes.map((theme) => {
        const selected = theme.id === selectedId;
        const live = theme.id === activeId;
        const [page, , panel] = surfaceSwatch(theme.design.surface);
        return (
          <button
            key={theme.id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onSelect(theme.id)}
            className={cn(
              "flex min-w-[210px] flex-none items-center gap-3 rounded-lg border p-2.5 text-left transition-colors lg:min-w-0 lg:w-full",
              selected
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "hover:border-border hover:bg-muted/40",
            )}
          >
            {/* Ground, panel and brand — the three colours that decide whether
                two themes read as different shops. */}
            <span
              className="flex h-10 w-10 flex-none items-center justify-end overflow-hidden rounded-md border p-1"
              style={{ background: page }}
            >
              <span
                className="h-full w-1/2 rounded-sm"
                style={{ background: panel }}
              />
              <span
                className="ml-0.5 h-full w-1.5 rounded-sm"
                style={{ background: theme.brandColor }}
              />
            </span>

            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-semibold">{theme.label}</span>
                {live ? (
                  <span className="flex flex-none items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-semibold text-primary">
                    <Check className="h-2.5 w-2.5" />
                    {modified ? "Live · edited" : "Live"}
                  </span>
                ) : null}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {theme.bestFor}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
