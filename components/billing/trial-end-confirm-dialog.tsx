"use client";
// coding-standard: maintained

import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/components/alert-dialog";
import type { AvailablePlan } from "@/types";

/**
 * Confirms ending an active free trial to switch onto a paid plan. Switching
 * mid-trial ends the trial immediately and requires payment — until that payment
 * lands the subscription is `incomplete`, which confines the workspace to the
 * billing page (data retained, nothing deleted). That is destructive enough, and
 * non-obvious enough, to confirm first. Controlled: a non-null `plan` opens it;
 * `onConfirm` proceeds with the change, `onOpenChange(false)` dismisses.
 *
 * Distinct from `TrialInfoModal`, which explains a trial *before* it starts.
 */
export function TrialEndConfirmDialog({
  plan,
  price,
  onConfirm,
  onOpenChange,
}: {
  plan: AvailablePlan | null;
  price: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("settings.billing.trialSwitch");

  return (
    <AlertDialog open={!!plan} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {plan ? t("body", { planName: plan.name, price }) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("keep")}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{t("confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
