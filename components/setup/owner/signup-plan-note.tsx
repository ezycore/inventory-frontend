"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { Badge } from "@/ui/components/badge";
import { useHydrated } from "@/hooks/use-hydrated";
import { getSignupPlanFromUrl } from "@/utils/signup-plan";

/**
 * What the merchant is actually signing up for, said on the form itself.
 *
 * Until 2026-08-16 the signup form named no plan at all: the plan rides in on a
 * query param from the marketing site and is otherwise chosen server-side, so a
 * direct visitor filled in eight fields without being told what they were
 * agreeing to (QA-010).
 *
 * **Only a plan the URL actually names is displayed.** With no param the
 * frontend genuinely does not know which plan it will get — Mission Control
 * picks the entry plan (first public + active by sort order) at signup, and
 * guessing it here is the exact fragility `getSignupPlanFromUrl` warns about:
 * the guess breaks silently the day that plan is renamed, and naming the wrong
 * plan on the signup form is worse than naming none. So the no-param case states
 * only what is true of **every** active plan — a 15-day trial, no card — and
 * says the choice comes later.
 */
export function SignupPlanNote() {
  const t = useTranslations("auth.signup.plan");
  // `window.location.search` is client-only; without this gate the first client
  // render would disagree with the server HTML.
  const hydrated = useHydrated();
  const planName = hydrated ? getSignupPlanFromUrl().planName : undefined;

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2.5">
      <Sparkles className="size-4 shrink-0 text-primary" />
      {planName ? (
        <Badge variant="secondary" className="font-medium">
          {planName}
        </Badge>
      ) : (
        <span className="text-sm font-medium">{t("chooseLater")}</span>
      )}
      <span className="text-sm text-muted-foreground">{t("trial")}</span>
    </div>
  );
}
