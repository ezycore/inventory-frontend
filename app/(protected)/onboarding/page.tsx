"use client";
// coding-standard: maintained

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { Button } from "@/ui/components/button";

import { useApplyOnboardingStep, useGetFeatures, useUpdateFeatures } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import type { FeatureName } from "@/types";
import { QuestionCard, type ChoiceOption } from "@/components/onboarding/question-card";
import { ReviewStep } from "@/components/onboarding/review-step";
import {
  QUESTION_COUNT,
  isConfidentAbout,
  payloadForStep,
  recommendationsFor,
  type ChannelAnswer,
  type OnboardingAnswers,
  type VatAnswer,
} from "@/components/onboarding/steps";

/**
 * The setup wizard: five questions, one per screen, then a review.
 *
 * Answers are written as they are given rather than batched into a draft — each
 * one is an ordinary feature override — so leaving half-way is harmless. What
 * cannot be derived is *where* the merchant got to: every feature starts ON, so
 * `true` is ambiguous between "answered yes" and "not reached yet". That is why
 * the backend stores `onboardingStep` and this page resumes from it
 * (docs/plan/onboarding-workspace.md §5.1).
 */
export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const user = useAuthStore((s) => s.user);
  const industry = user?.organization?.industry;

  const { data: featuresData, isLoading, isError } = useGetFeatures();
  const applyStep = useApplyOnboardingStep();
  const { mutate: updateFeatures } = useUpdateFeatures();

  // `null` = the merchant hasn't navigated yet, so the server's resume point
  // wins. Deriving it this way rather than syncing state in an effect means
  // there is no frame where the wizard shows step 1 before jumping.
  const [localIndex, setLocalIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [pendingFeature, setPendingFeature] = useState<FeatureName | null>(null);

  const features = featuresData?.data?.features;
  const onboarding = featuresData?.data?.onboarding;

  // Clamped to the review screen so a completed-then-reopened wizard lands on
  // the summary rather than past the end.
  const index =
    localIndex ?? Math.min(onboarding?.step ?? 0, QUESTION_COUNT);

  // Someone who already finished has no business here — send them to the app.
  useEffect(() => {
    if (onboarding?.completedAt) router.replace("/dashboard");
  }, [onboarding?.completedAt, router]);

  const recommended = useMemo(() => recommendationsFor(industry), [industry]);

  const save = (nextIndex: number, patch: OnboardingAnswers) => {
    const merged = { ...answers, ...patch };
    setAnswers(merged);
    applyStep.mutate(payloadForStep(index, merged));
    setLocalIndex(nextIndex);
  };

  const answer = <K extends keyof OnboardingAnswers>(
    key: K,
    value: OnboardingAnswers[K],
  ) => save(index + 1, { [key]: value } as OnboardingAnswers);

  // A failed load must not read as a slow one. `/organization/features` 403s for
  // a workspace confined to billing (an unpaid first invoice), and `isLoading`
  // goes false while `features` stays undefined — so waiting on both left the
  // merchant on a spinner that never resolved, with no way out of the wizard.
  // The layout now routes them to billing before they get here; this is the
  // backstop for a direct visit.
  if (isError || (!isLoading && !features)) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div className="max-w-sm space-y-3 text-center">
          <h1 className="text-lg font-semibold">{t("unavailable.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("unavailable.description")}
          </p>
          <Button onClick={() => router.replace("/dashboard/billing")}>
            {t("unavailable.action")}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !features) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const stepLabel = t("stepLabel", {
    current: Math.min(index + 1, QUESTION_COUNT),
    total: QUESTION_COUNT,
  });
  const back = () => setLocalIndex(Math.max(0, index - 1));

  const channelOptions: ChoiceOption<ChannelAnswer>[] = [
    { value: "shop", label: t("channel.shop"), hint: t("channel.shopHint") },
    { value: "online", label: t("channel.online"), hint: t("channel.onlineHint") },
    { value: "both", label: t("channel.both") },
  ];

  const yesNo = (yes: string, no: string): ChoiceOption<"yes" | "no">[] => [
    { value: "yes", label: yes },
    { value: "no", label: no },
  ];

  const vatOptions: ChoiceOption<VatAnswer>[] = [
    { value: "unregistered", label: t("vat.unregistered") },
    { value: "standard_15", label: t("vat.standard15") },
    { value: "reduced", label: t("vat.reduced") },
    {
      value: "turnover_4",
      label: t("vat.turnover4"),
      hint: t("vat.turnover4Hint"),
    },
  ];

  const screens = [
    <QuestionCard
      key="channel"
      lead={t("channel.lead")}
      question={t("channel.question")}
      options={channelOptions}
      value={answers.channel}
      onSelect={(v) => answer("channel", v)}
      onBack={back}
      canGoBack={false}
      stepLabel={stepLabel}
      isSaving={applyStep.isPending}
    />,
    <QuestionCard
      key="locations"
      lead={t("locations.lead")}
      question={t("locations.question")}
      options={[
        { value: "one", label: t("locations.one") },
        { value: "many", label: t("locations.many"), hint: t("locations.manyHint") },
      ]}
      value={
        answers.multiLocation === undefined
          ? undefined
          : answers.multiLocation
            ? "many"
            : "one"
      }
      onSelect={(v) => answer("multiLocation", v === "many")}
      onBack={back}
      canGoBack
      stepLabel={stepLabel}
      isSaving={applyStep.isPending}
    />,
    <QuestionCard
      key="vat"
      lead={t("vat.lead")}
      question={t("vat.question")}
      options={vatOptions}
      value={answers.vat}
      onSelect={(v) => answer("vat", v)}
      onBack={back}
      canGoBack
      stepLabel={stepLabel}
      isSaving={applyStep.isPending}
    />,
    <QuestionCard
      key="expiry"
      // Where the industry signal is strong, confirm rather than ask — it is the
      // clearest way to say "we understood your business" (§5.7).
      lead={
        isConfidentAbout(industry, "expiryTracking")
          ? t("expiry.lead")
          : undefined
      }
      question={t("expiry.question")}
      options={yesNo(t("expiry.yes"), t("expiry.no"))}
      value={
        (answers.expiryTracking ?? recommended.expiryTracking) ? "yes" : "no"
      }
      onSelect={(v) => answer("expiryTracking", v === "yes")}
      onBack={back}
      canGoBack
      stepLabel={stepLabel}
      isSaving={applyStep.isPending}
    />,
    <QuestionCard
      key="barcode"
      lead={
        isConfidentAbout(industry, "barcodeSystem")
          ? t("barcode.lead")
          : undefined
      }
      question={t("barcode.question")}
      options={yesNo(t("barcode.yes"), t("barcode.no"))}
      value={
        (answers.barcodeSystem ?? recommended.barcodeSystem) ? "yes" : "no"
      }
      onSelect={(v) => answer("barcodeSystem", v === "yes")}
      onBack={back}
      canGoBack
      stepLabel={stepLabel}
      isSaving={applyStep.isPending}
    />,
  ];

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:py-16">
      {index < QUESTION_COUNT ? (
        screens[index]
      ) : (
        <ReviewStep
          features={features}
          pendingFeature={pendingFeature}
          isSaving={applyStep.isPending}
          onBack={back}
          onToggle={(feature, next) => {
            setPendingFeature(feature);
            updateFeatures(
              { [feature]: next },
              { onSettled: () => setPendingFeature(null) },
            );
          }}
          onConfirm={() =>
            applyStep.mutate(
              { step: QUESTION_COUNT + 1, complete: true },
              { onSuccess: () => router.replace("/dashboard") },
            )
          }
        />
      )}
    </div>
  );
}
