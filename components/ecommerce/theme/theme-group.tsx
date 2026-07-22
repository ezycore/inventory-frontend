"use client";
// coding-standard: maintained

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/ui/lib/utils";

/**
 * One collapsible row of the Theme settings list: icon chip + title + live
 * state summary, with the body revealed on toggle. The summary is the collapsed
 * face of the group — keep it a one-liner that reflects current state.
 */
export function ThemeGroup({
  icon: Icon,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  summary: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border-b last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/40"
      >
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold leading-tight">
            {title}
          </span>
          <span className="block truncate text-[11.5px] leading-snug text-muted-foreground">
            {summary}
          </span>
        </span>
        <ChevronRight
          className={cn(
            "h-4 w-4 flex-none text-muted-foreground/70 transition-transform",
            open && "rotate-90",
          )}
        />
      </button>
      {open && (
        <div className="px-3.5 pb-4 pt-0.5 lg:pl-[3.625rem]">{children}</div>
      )}
    </section>
  );
}
