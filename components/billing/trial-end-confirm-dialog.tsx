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
 * mid-trial ends the trial immediately and requires payment (the backend drops
 * the workspace to the free baseline until the new plan is paid), so this
 * destructive, non-obvious step is confirmed first. Controlled: a non-null `plan`
 * opens it; `onConfirm` proceeds with the change, `onOpenChange(false)` dismisses.
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
