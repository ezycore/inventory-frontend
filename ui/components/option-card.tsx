"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/ui/lib/utils";

/**
 * The app's "pick one of these" controls.
 *
 * Both shapes share one selection treatment. That treatment used to be
 * hand-pasted into five files (theme presets, home layouts, header source,
 * announcement size/fit, and the template option rows), which is how they drifted
 * apart — change it here and every picker moves together.
 */
const base =
  "rounded-lg border text-left transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50";
const selectedStyle = "border-primary ring-2 ring-primary/30";
const restStyle = "hover:bg-muted/50";

/** Text-only option — the compact form for short, self-explanatory choices. */
export function OptionChip({
  selected,
  onSelect,
  title,
  disabled,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  /** Native tooltip for a choice whose label can't carry the whole meaning. */
  title?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      title={title}
      className={cn(
        base,
        "px-3 py-1.5 text-sm",
        selected ? selectedStyle : restStyle,
      )}
    >
      {children}
    </button>
  );
}

/**
 * Option with a picture of what it does — a wireframe sketch above the label
 * (`media`) or an icon beside it (`icon`). Prefer this over `OptionChip` for
 * anything visual: a merchant cannot infer "Sticky buy bar" from the words.
 *
 * `action` renders as a sibling in the top-right corner, not a nested button —
 * a button inside a button is invalid markup and swallows the outer click.
 */
export function OptionCard({
  selected,
  onSelect,
  label,
  description,
  media,
  icon: Icon,
  badge,
  action,
  tone = "muted",
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  description?: ReactNode;
  /** Wireframe sketch (or any block) rendered above the label. */
  media?: ReactNode;
  /** Icon rendered to the left of the label; ignored when `media` is set. */
  icon?: LucideIcon;
  badge?: ReactNode;
  action?: ReactNode;
  /** `warn` colours the description when it reports something to fix. */
  tone?: "muted" | "warn";
  className?: string;
}) {
  const text = (
    <span className="min-w-0">
      <span className="flex flex-wrap items-center gap-x-1.5 text-xs font-semibold">
        {label}
        {badge}
      </span>
      {description ? (
        <span
          className={cn(
            "mt-0.5 block text-xs leading-snug",
            tone === "warn" ? "text-amber-700 dark:text-amber-500" : "text-muted-foreground",
          )}
        >
          {description}
        </span>
      ) : null}
    </span>
  );

  const button = (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        base,
        "w-full",
        media ? "flex flex-col gap-1.5 p-2" : "flex items-start gap-2.5 p-3",
        selected ? selectedStyle : restStyle,
        className,
      )}
    >
      {media}
      {Icon && !media ? (
        <Icon className="mt-0.5 h-4 w-4 flex-none text-primary" />
      ) : null}
      {text}
    </button>
  );

  if (!action) return button;
  return (
    <div className="relative">
      {button}
      <span className="absolute right-2 top-2">{action}</span>
    </div>
  );
}
