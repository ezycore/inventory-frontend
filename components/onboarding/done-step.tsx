"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/ui/components/button";

/**
 * The closing screen.
 *
 * The wizard used to end by `router.replace("/dashboard")` the instant the
 * confirm mutation resolved — the merchant answered six screens and the flow
 * simply vanished, dropping them into a sidebar with no acknowledgement that
 * anything had been set up. Setup is the one moment worth marking: it is the
 * only screen in the product that reports work the merchant just finished.
 *
 * It is local state, not a step: `onboardingCompletedAt` is already written by
 * the time this renders, so a reload lands on the dashboard rather than here.
 */
export function DoneStep({
  organizationName,
  onEnter,
}: {
  organizationName?: string;
  onEnter: () => void;
}) {
  const t = useTranslations("onboarding");

  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center sm:py-12">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Check className="h-8 w-8 text-primary" />
      </span>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          {organizationName
            ? t("done.titleNamed", { organization: organizationName })
            : t("done.title")}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {t("done.description")}
        </p>
      </div>

      <Button size="lg" className="w-full gap-2" onClick={onEnter}>
        {t("done.action")}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
