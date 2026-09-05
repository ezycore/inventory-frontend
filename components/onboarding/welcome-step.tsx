"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { ArrowRight, Percent, Sliders, Sparkles, Store } from "lucide-react";

import { Button } from "@/ui/components/button";

/**
 * The opening screen — *"Let's get your workspace ready"*, which the plan's own
 * mock (docs/plan/onboarding-workspace.md §5.3) leads with and the wizard had
 * never had.
 *
 * Without it the merchant lands cold on "How do you sell to your customers?"
 * with no greeting, no idea how long this takes and no idea what it decides.
 * The three lines below are not decoration: they are what makes the questions
 * feel bounded rather than open-ended.
 *
 * It is a *local* screen — it writes nothing and does not consume an
 * `onboardingStep`, so a resumed wizard skips straight past it.
 */
const TOPICS = [
  { icon: Store, key: "channel" },
  { icon: Percent, key: "tax" },
  { icon: Sliders, key: "tools" },
] as const;

export function WelcomeStep({
  organizationName,
  questionCount,
  onStart,
}: {
  organizationName?: string;
  /**
   * How many questions this workspace is actually asked. Passed in rather than
   * read from `QUESTION_COUNT`, because the plan can settle several of them
   * before the merchant is asked anything — promising eight and delivering five
   * is the wrong direction to be wrong in.
   */
  questionCount: number;
  onStart: () => void;
}) {
  const t = useTranslations("onboarding");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {t("welcome.badge")}
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-balance">
          {t("welcome.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("welcome.subtitle", {
            // A workspace always has a name by now — signup requires it — but
            // the store rehydrates a frame later than this renders.
            organization: organizationName || t("welcome.yourBusiness"),
            count: questionCount,
          })}
        </p>
      </div>

      <ul className="divide-y rounded-xl border bg-card">
        {TOPICS.map((topic) => (
          <li key={topic.key} className="flex items-start gap-3.5 px-4 py-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <topic.icon className="h-4 w-4 text-primary" />
            </span>
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium">
                {t(`welcome.topics.${topic.key}Title`)}
              </p>
              <p className="text-sm text-muted-foreground">
                {t(`welcome.topics.${topic.key}Description`)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-3">
        <Button size="lg" className="w-full gap-2" onClick={onStart}>
          {t("welcome.start")}
          <ArrowRight className="h-4 w-4" />
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {t("welcome.reassurance")}
        </p>
      </div>
    </div>
  );
}
