"use client";
// coding-standard: maintained

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Building2,
  Check,
  CircleSlash,
  Globe,
  Landmark,
  Layers,
  Loader2,
  MapPin,
  Percent,
  Receipt,
  Store,
  X,
} from "lucide-react";

import { Button } from "@/ui/components/button";

import { useApplyOnboardingStep, useGetFeatures, useUpdateFeatures } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { resolveVatRegistration } from "@/lib/feature-utils";
import type { FeatureName } from "@/types";
import { QuestionCard, type ChoiceOption } from "@/components/onboarding/question-card";
import { ReviewStep } from "@/components/onboarding/review-step";
import { WelcomeStep } from "@/components/onboarding/welcome-step";
import { DoneStep } from "@/components/onboarding/done-step";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import {
  QUESTION_COUNT,
  answersFromProgress,
  isConfidentAbout,
  payloadForStep,
  recommendationsFor,
  toVatAnswer,
  type ChannelAnswer,
  type OnboardingAnswers,
  type VatAnswer,
} from "@/components/onboarding/steps";

/**
 * The setup wizard: a welcome, five questions one per screen, a review, and a
 * closing screen.
 *
 * Answers are written as they are given rather than batched into a draft — each
 * one is an ordinary feature override — so leaving half-way is harmless. What
 * cannot be derived is *where* the merchant got to: every feature starts ON, so
 * `true` is ambiguous between "answered yes" and "not reached yet". That is why
 * the backend stores `onboardingStep` and this page resumes from it
 * (docs/plan/onboarding-workspace.md §5.1).
 *
 * Only the five questions are steps. The welcome and the closing screen are
 * local state that writes nothing — so a resumed wizard skips the welcome, and
 * a reload after confirming lands on the dashboard rather than back on "done".
 */
const STAGE_WELCOME = -1;
const STAGE_REVIEW = QUESTION_COUNT;
const STAGE_DONE = QUESTION_COUNT + 1;

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const user = useAuthStore((s) => s.user);
  const organization = user?.organization;
  const industry = organization?.industry;

  const { data: featuresData, isLoading, isError } = useGetFeatures();
  const applyStep = useApplyOnboardingStep();
  const { mutate: updateFeatures } = useUpdateFeatures();

  // `null` = the merchant hasn't navigated yet, so the server's resume point
  // wins. Deriving it this way rather than syncing state in an effect means
  // there is no frame where the wizard shows step 1 before jumping.
  const [localIndex, setLocalIndex] = useState<number | null>(null);
  const [localAnswers, setLocalAnswers] = useState<OnboardingAnswers | null>(
    null,
  );
  const [pendingChoice, setPendingChoice] = useState<string | null>(null);
  const [pendingFeature, setPendingFeature] = useState<FeatureName | null>(null);
  const [completingHere, setCompletingHere] = useState(false);

  const features = featuresData?.data?.features;
  // The plan ceiling rides along in the same response. The review screen needs
  // it: every switch it renders writes through `updateFeatures`, which 403s on a
  // feature the plan does not grant.
  const planFeatures = featuresData?.data?.planFeatures;
  const onboarding = featuresData?.data?.onboarding;
  const serverStep = onboarding?.step ?? 0;

  // A fresh workspace opens on the welcome; a resumed one goes straight to the
  // question it stopped at, clamped to the review so a completed-then-reopened
  // wizard lands on the summary rather than past the end.
  const index =
    localIndex ??
    (serverStep === 0 ? STAGE_WELCOME : Math.min(serverStep, STAGE_REVIEW));

  // Answers the workspace already carries, so the questions behind the resume
  // point render with their answer selected instead of blank (see
  // `answersFromProgress`). Local answers outrank them the moment there is one.
  const restored = useMemo(
    () =>
      answersFromProgress(
        features,
        serverStep,
        toVatAnswer(resolveVatRegistration(organization?.vatRegistrationHistory)),
      ),
    [features, serverStep, organization?.vatRegistrationHistory],
  );
  const answers = localAnswers ?? restored;

  // Someone who already finished has no business here — send them to the app.
  // Except when they finished *just now*: confirming writes `completedAt` into
  // the same cache this reads, so without the guard the closing screen would be
  // redirected away in the frame it first rendered.
  //
  // The guard is raised when the merchant clicks Confirm, NOT when the mutation
  // resolves. React Query `await`s the hook's own `onSuccess` — the one that
  // does `setQueryData` — before it calls the per-call `onSuccess`, so a flag
  // set there arrives a render too late: the cache already carries `completedAt`
  // and this effect has already fired. Browser-only symptom; the closing screen
  // rendered and was replaced by the dashboard inside 500ms.
  useEffect(() => {
    if (completingHere) return;
    if (onboarding?.completedAt) router.replace("/dashboard");
  }, [completingHere, onboarding?.completedAt, router]);

  const recommended = useMemo(() => recommendationsFor(industry), [industry]);

  const save = (nextIndex: number, patch: OnboardingAnswers) => {
    const merged = { ...answers, ...patch };
    applyStep.mutate(payloadForStep(index, merged), {
      // Advance only once the answer is stored. Moving first left a merchant
      // whose save failed a question ahead of a server that never recorded the
      // answer — silently, since the error toast says nothing about which
      // question it belonged to.
      onSuccess: () => {
        setLocalAnswers(merged);
        setLocalIndex(nextIndex);
      },
      onSettled: () => setPendingChoice(null),
    });
  };

  /** `option` is the tapped row; `value` is what that row means as an answer. */
  const choose = <K extends keyof OnboardingAnswers>(
    option: string,
    key: K,
    value: OnboardingAnswers[K],
  ) => {
    setPendingChoice(option);
    save(index + 1, { [key]: value } as OnboardingAnswers);
  };

  // A failed load must not read as a slow one. `/organization/features` 403s for
  // a workspace confined to billing (an unpaid first invoice), and `isLoading`
  // goes false while `features` stays undefined — so waiting on both left the
  // merchant on a spinner that never resolved, with no way out of the wizard.
  // The layout now routes them to billing before they get here; this is the
  // backstop for a direct visit.
  if (isError || (!isLoading && !features)) {
    return (
      <WizardShell>
        <div className="mx-auto max-w-sm space-y-3 py-12 text-center">
          <h1 className="text-lg font-semibold">{t("unavailable.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("unavailable.description")}
          </p>
          <Button onClick={() => router.replace("/dashboard/billing")}>
            {t("unavailable.action")}
          </Button>
        </div>
      </WizardShell>
    );
  }

  if (isLoading || !features) {
    return (
      <WizardShell>
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </WizardShell>
    );
  }

  const back = () => setLocalIndex(Math.max(STAGE_WELCOME, index - 1));

  const channelOptions: ChoiceOption<ChannelAnswer>[] = [
    { value: "shop", label: t("channel.shop"), hint: t("channel.shopHint"), icon: Store },
    { value: "online", label: t("channel.online"), hint: t("channel.onlineHint"), icon: Globe },
    { value: "both", label: t("channel.both"), icon: Layers },
  ];

  const yesNo = (yes: string, no: string): ChoiceOption<"yes" | "no">[] => [
    { value: "yes", label: yes, icon: Check },
    { value: "no", label: no, icon: X },
  ];

  const vatOptions: ChoiceOption<VatAnswer>[] = [
    { value: "unregistered", label: t("vat.unregistered"), icon: CircleSlash },
    { value: "standard_15", label: t("vat.standard15"), icon: Receipt },
    { value: "reduced", label: t("vat.reduced"), icon: Percent },
    {
      value: "turnover_4",
      label: t("vat.turnover4"),
      hint: t("vat.turnover4Hint"),
      icon: Landmark,
    },
  ];

  const screens = [
    <QuestionCard
      key="channel"
      lead={t("channel.lead")}
      question={t("channel.question")}
      options={channelOptions}
      value={answers.channel}
      savingValue={pendingChoice ?? undefined}
      onSelect={(v) => choose(v, "channel", v)}
      onBack={back}
      isSaving={applyStep.isPending}
    />,
    <QuestionCard
      key="locations"
      lead={t("locations.lead")}
      question={t("locations.question")}
      options={[
        { value: "one", label: t("locations.one"), icon: MapPin },
        {
          value: "many",
          label: t("locations.many"),
          hint: t("locations.manyHint"),
          icon: Building2,
        },
      ]}
      value={
        answers.multiLocation === undefined
          ? undefined
          : answers.multiLocation
            ? "many"
            : "one"
      }
      savingValue={pendingChoice ?? undefined}
      onSelect={(v) => choose(v, "multiLocation", v === "many")}
      onBack={back}
      isSaving={applyStep.isPending}
    />,
    <QuestionCard
      key="vat"
      lead={t("vat.lead")}
      question={t("vat.question")}
      options={vatOptions}
      value={answers.vat}
      savingValue={pendingChoice ?? undefined}
      onSelect={(v) => choose(v, "vat", v)}
      onBack={back}
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
      savingValue={pendingChoice ?? undefined}
      onSelect={(v) => choose(v, "expiryTracking", v === "yes")}
      onBack={back}
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
      savingValue={pendingChoice ?? undefined}
      onSelect={(v) => choose(v, "barcodeSystem", v === "yes")}
      onBack={back}
      isSaving={applyStep.isPending}
    />,
  ];

  // The bar is denominated over the questions *plus* the review, so answering
  // the last question doesn't fill it while a screen still remains.
  const progressFor = (stage: number) => {
    if (stage === STAGE_WELCOME || stage === STAGE_DONE) return undefined;
    return ((stage + 1) / (QUESTION_COUNT + 1)) * 100;
  };

  return (
    <WizardShell
      progress={progressFor(index)}
      progressLabel={
        index < QUESTION_COUNT
          ? t("stepLabel", { current: index + 1, total: QUESTION_COUNT })
          : t("review.stepLabel")
      }
    >
      {index === STAGE_WELCOME ? (
        <WelcomeStep
          organizationName={organization?.name}
          onStart={() => setLocalIndex(0)}
        />
      ) : index === STAGE_DONE ? (
        <DoneStep
          organizationName={organization?.name}
          onEnter={() => router.replace("/dashboard")}
        />
      ) : index < QUESTION_COUNT ? (
        screens[index]
      ) : (
        <ReviewStep
          features={features}
          planFeatures={planFeatures}
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
          onConfirm={() => {
            setCompletingHere(true);
            applyStep.mutate(
              { step: QUESTION_COUNT + 1, complete: true },
              {
                onSuccess: () => setLocalIndex(STAGE_DONE),
                // Nothing was completed, so restore the redirect guard. It is
                // inert either way — a failed complete leaves `completedAt`
                // null, and the effect only fires on a set one.
                onError: () => setCompletingHere(false),
              },
            );
          }}
        />
      )}
    </WizardShell>
  );
}
