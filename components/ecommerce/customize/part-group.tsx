"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/ui/lib/utils";

/**
 * One part of the store in the Customize rail: icon chip + name + a live
 * one-line summary of its current state, with the editor revealed on toggle.
 *
 * The summary is the collapsed face of the part and is load-bearing — with all
 * ten collapsed, the rail reads as an audit of the whole storefront. Keep it a
 * one-liner describing what the shop *has*, never an instruction.
 *
 * `control` renders beside the row rather than inside the toggle button: a
 * switch nested in a button is invalid markup and steals the toggle's click.
 */
export function PartGroup({
  icon: Icon,
  media,
  title,
  summary,
  open,
  onToggle,
  dirty,
  control,
  children,
}: {
  icon?: LucideIcon;
  /** Replaces the icon chip — used by Brand for its live colour swatch. */
  media?: ReactNode;
  title: string;
  summary: ReactNode;
  open: boolean;
  onToggle: () => void;
  /** Marks the part as changed since the last save. */
  dirty?: boolean;
  control?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-b last:border-b-0">
      <div
        className={cn(
          "flex items-center transition-colors hover:bg-muted/40",
          open && "bg-muted/30",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3 text-left outline-none focus-visible:bg-muted/60"
        >
          {media ?? (
            <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
              {Icon ? <Icon className="h-4 w-4" /> : null}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-sm font-semibold leading-tight">
              {title}
              {dirty ? (
                <span
                  className="h-1.5 w-1.5 flex-none rounded-full bg-amber-500"
                  aria-label="unsaved changes"
                />
              ) : null}
            </span>
            <span className="mt-0.5 block truncate text-xs leading-snug text-muted-foreground">
              {summary}
            </span>
          </span>
          <ChevronRight
            className={cn(
              "h-4 w-4 flex-none text-muted-foreground transition-transform",
              open && "rotate-90",
            )}
          />
        </button>
        {control ? <span className="flex-none pl-2 pr-3.5">{control}</span> : null}
      </div>
      {open ? (
        // Each direct child is one control group, hairline-separated. A part can
        // hold several unrelated settings — Product cards holds card style AND
        // card buttons — and without a rule between them their option tiles read
        // as one long grid of choices instead of two questions.
        <div className="divide-y border-t bg-muted/20 px-3.5 [&>*]:py-4">
          {children}
        </div>
      ) : null}
    </section>
  );
}

/**
 * One labelled control group inside an open part — the unit `PartGroup`
 * separates. Every group of controls gets one: an unlabelled picker sitting
 * under another picker is indistinguishable from more options for the same
 * question.
 */
export function PartBlock({
  label,
  hint,
  children,
}: {
  label: string;
  /** Explanatory line under the controls. */
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <PartLabel>{label}</PartLabel>
      {children}
      {hint ? <PartHint>{hint}</PartHint> : null}
    </div>
  );
}

/**
 * A labelled control for a part that puts SEVERAL settings in one `PartGroup`
 * slot — the compact sibling of `PartBlock`.
 *
 * The difference is vertical padding, and it is the whole point: `PartGroup`
 * pays `py-4` per direct child, so six settings rendered as six `PartBlock`s
 * spend 192px on block padding alone before a single control is drawn. Six
 * `PartField`s inside one wrapper spend 32px. Use `PartBlock` when the setting
 * genuinely is its own question (Product cards' style vs its buttons); use this
 * when the settings are facets of one (Design's six axes).
 */
export function PartField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <PartLabel>{label}</PartLabel>
      {children}
      {hint ? <PartHint>{hint}</PartHint> : null}
    </div>
  );
}

/** Small caption above a block of controls inside an open part. */
export function PartLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

/** Explanatory line under a control — 12px floor, never the old 10–11px. */
export function PartHint({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "warn";
}) {
  return (
    <p
      className={cn(
        "text-xs leading-snug",
        tone === "warn"
          ? "text-amber-700 dark:text-amber-500"
          : "text-muted-foreground",
      )}
    >
      {children}
    </p>
  );
}
