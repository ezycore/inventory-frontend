"use client";
// coding-standard: maintained

import { cn } from "@/ui/lib/utils";
import { Button } from "@/ui/components/button";
import { ArrowLeft, Loader2 } from "lucide-react";

export interface ChoiceOption<V extends string> {
  value: V;
  label: string;
  /** Optional second line — used where an answer has a consequence worth stating. */
  hint?: string;
}

/**
 * One question, one screen.
 *
 * The wizard is a guided conversation rather than a form: a short lead-in that
 * acknowledges the previous answer, then a single question with two to four
 * plain choices. A six-field page would say "fill this in"; this says "tell us
 * about your business", which is the whole point
 * (docs/plan/onboarding-workspace.md §5.3).
 *
 * The step indicator and Back button are not optional chrome — without them a
 * one-at-a-time flow feels open-ended, and a merchant who mistaps has no way
 * back.
 */
export function QuestionCard<V extends string>({
  lead,
  question,
  options,
  value,
  onSelect,
  onBack,
  canGoBack,
  stepLabel,
  isSaving,
}: {
  lead?: string;
  question: string;
  options: readonly ChoiceOption<V>[];
  value?: V;
  onSelect: (value: V) => void;
  onBack: () => void;
  canGoBack: boolean;
  stepLabel: string;
  isSaving?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        {canGoBack ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="-ml-2 text-muted-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        ) : (
          <span />
        )}
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {stepLabel}
        </span>
      </div>

      <div className="space-y-2">
        {lead && <p className="text-sm text-muted-foreground">{lead}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {question}
        </h1>
      </div>

      <div className="grid gap-3">
        {options.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={isSaving}
              onClick={() => onSelect(option.value)}
              className={cn(
                "group flex w-full items-start justify-between gap-3 rounded-lg border p-4 text-left transition-colors",
                "hover:border-primary/60 hover:bg-primary/5",
                "disabled:pointer-events-none disabled:opacity-60",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card",
              )}
            >
              <span className="space-y-1">
                <span className="block font-medium">{option.label}</span>
                {option.hint && (
                  <span className="block text-sm text-muted-foreground">
                    {option.hint}
                  </span>
                )}
              </span>
              {isSelected && isSaving && (
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
