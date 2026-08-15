"use client";
// coding-standard: maintained

import { cn } from "@/ui/lib/utils";
import { Button } from "@/ui/components/button";
import { useTranslations } from "next-intl";
import { ArrowLeft, Check, ChevronRight, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ChoiceOption<V extends string> {
  value: V;
  label: string;
  /** Optional second line — used where an answer has a consequence worth stating. */
  hint?: string;
  /**
   * Optional leading mark. The review screen has carried per-feature icons from
   * the start; the questions were plain text rows beside it, which made the
   * flow read as a form the moment the merchant reached the last screen.
   */
  icon?: LucideIcon;
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
 * The Back button is not optional chrome — a merchant who mistaps has no other
 * recovery. Its counterpart, the step indicator, lives in `WizardShell` now: it
 * belongs to the run rather than to any one question, and every screen in the
 * flow needs it, including the review.
 */
export function QuestionCard<V extends string>({
  lead,
  question,
  options,
  value,
  savingValue,
  onSelect,
  onBack,
  isSaving,
}: {
  lead?: string;
  question: string;
  options: readonly ChoiceOption<V>[];
  value?: V;
  /**
   * The option currently being written. It is not `value`: the answer is only
   * committed once the save lands, so without this the row the merchant just
   * tapped would show no feedback at all while the request is in flight.
   */
  savingValue?: string;
  onSelect: (value: V) => void;
  onBack: () => void;
  isSaving?: boolean;
}) {
  const t = useTranslations("onboarding");

  return (
    <div className="space-y-6 duration-300 animate-in fade-in slide-in-from-bottom-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2 text-muted-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        {t("back")}
      </Button>

      <div className="space-y-2">
        {lead && <p className="text-sm text-muted-foreground">{lead}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {question}
        </h1>
      </div>

      <div className="grid gap-3">
        {options.map((option) => {
          const isPending = savingValue === option.value;
          const isSelected = value === option.value || isPending;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              disabled={isSaving}
              onClick={() => onSelect(option.value)}
              className={cn(
                "group flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-all",
                "hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-60",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border bg-card",
              )}
            >
              {option.icon && (
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  <option.icon className="h-4 w-4" />
                </span>
              )}

              <span className="min-w-0 flex-1 space-y-0.5">
                <span className="block font-medium">{option.label}</span>
                {option.hint && (
                  <span className="block text-sm text-muted-foreground">
                    {option.hint}
                  </span>
                )}
              </span>

              {isPending ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
              ) : isSelected ? (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
