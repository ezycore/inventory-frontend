"use client";
// coding-standard: maintained

import { Check } from "lucide-react";
import { type Control, useWatch } from "react-hook-form";

import { cn } from "@/ui/lib/utils";

/** Field names of each part, in the order `useWatch` returns their values. */
const ACCOUNT_FIELDS = ["firstName", "email", "password", "confirmPassword"];
const ORG_FIELDS = [
  "organizationName",
  "organizationSlug",
  "industry",
  "country",
  "timezone",
  "currency",
];

/**
 * Two-part progress for the signup form. Both parts are on screen at once, so
 * this reports what is actually filled in rather than pretending to be a wizard
 * — a static "step 2 pending" would be decoration, not information.
 *
 * Subscribes via `useWatch` inside its own component so a keystroke re-renders
 * this rail and not the whole page (and not DynamicForm with it).
 */
export function SetupProgress({ control }: { control: Control<any> }) {
  const values = useWatch({ control, name: [...ACCOUNT_FIELDS, ...ORG_FIELDS] });
  const filled = (from: number, count: number) =>
    values.slice(from, from + count).every((v) => Boolean(v));

  const steps = [
    { label: "Your account", done: filled(0, ACCOUNT_FIELDS.length) },
    {
      label: "Your organization",
      done: filled(ACCOUNT_FIELDS.length, ORG_FIELDS.length),
    },
  ];

  return (
    <ol className="flex items-center gap-3">
      {steps.map((step, i) => (
        <li key={step.label} className="flex flex-1 items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                step.done
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-muted text-muted-foreground",
              )}
            >
              {step.done ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-xs font-medium whitespace-nowrap",
                step.done ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
        </li>
      ))}
    </ol>
  );
}
