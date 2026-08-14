"use client";
// coding-standard: maintained

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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
  const user = useAuthStore((s) => s.user);
  const industry = user?.organization?.industry;

  const { data: featuresData, isLoading } = useGetFeatures();
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

  if (isLoading || !features) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const stepLabel = `Step ${Math.min(index + 1, QUESTION_COUNT)} of ${QUESTION_COUNT}`;
  const back = () => setLocalIndex(Math.max(0, index - 1));

  const channelOptions: ChoiceOption<ChannelAnswer>[] = [
    { value: "shop", label: "At a shop", hint: "Customers buy at your counter" },
    { value: "online", label: "Online", hint: "Facebook, WhatsApp, or your own store" },
    { value: "both", label: "Both" },
  ];

  const yesNo = (yes: string, no: string): ChoiceOption<"yes" | "no">[] => [
    { value: "yes", label: yes },
    { value: "no", label: no },
  ];

  const vatOptions: ChoiceOption<VatAnswer>[] = [
    { value: "unregistered", label: "Not registered" },
    { value: "standard_15", label: "Standard rated (15%)" },
    { value: "reduced", label: "Reduced rate" },
    {
      value: "turnover_4",
      label: "Turnover tax (4%)",
      hint: "Your invoices carry no VAT line",
    },
  ];

  const screens = [
    <QuestionCard
      key="channel"
      lead="First, tell us how you sell."
      question="How do you sell to your customers?"
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
      lead="Got it."
      question="How many locations do you manage?"
      options={[
        { value: "one", label: "One" },
        { value: "many", label: "More than one", hint: "Shops or warehouses you move stock between" },
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
      lead="Now let's set up your tax information."
      question="Is your business VAT registered?"
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
          ? "Shops like yours usually track expiry dates."
          : undefined
      }
      question="Do you track expiry or batch dates on products?"
      options={yesNo("Yes, track expiry dates", "No, skip it")}
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
          ? "Shops like yours usually scan barcodes."
          : undefined
      }
      question="Do you scan barcodes when selling?"
      options={yesNo("Yes, we scan barcodes", "No, we don't")}
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
