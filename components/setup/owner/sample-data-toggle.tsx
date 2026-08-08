"use client";
// coding-standard: maintained

import { Sparkles } from "lucide-react";

import { Switch } from "@/ui/components/switch";
import { cn } from "@/ui/lib/utils";

export interface SampleDataToggleProps {
  value?: boolean;
  onChange: (next: boolean) => void;
}

/**
 * Rich toggle card for the signup form's "load sample data" option. Rendered
 * as a `custom` field (with `zodType: "boolean"`) so the schema still sees a
 * plain boolean.
 */
export function SampleDataToggle({ value, onChange }: SampleDataToggleProps) {
  const checked = Boolean(value);

  return (
    <div
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={cn(
        "flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 transition-colors",
        checked
          ? "border-primary bg-primary/5 ring-1 ring-primary dark:bg-primary/10"
          : "border-input hover:border-primary/40 hover:bg-accent/40",
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
            checked
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10 text-primary dark:bg-primary/15",
          )}
        >
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            Load sample data so I can explore
          </p>
          <p className="text-sm text-muted-foreground">
            Pre-fill your workspace with example products, stock, purchases and
            sales. You can clear it anytime.
          </p>
        </div>
      </div>
      {/* Display-only — the whole card handles the toggle. */}
      <Switch checked={checked} className="pointer-events-none mt-0.5" />
    </div>
  );
}
