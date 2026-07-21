"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useAuthStore } from "@/services/stores";
import { useUpdateVatSettings } from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { NumberField } from "@/ui/components/number-field";
import { Label } from "@/ui/components/label";

const DEFAULT_FY = { startMonth: 7, startDay: 1, endMonth: 6, endDay: 30 };

/**
 * The financial-year boundary.
 *
 * It used to live on the VAT settings page, which was the wrong axis: the VAT
 * period is always a calendar month, while the financial year is an accounting /
 * income-tax boundary that drives report date ranges. It belongs with the
 * organization's other general settings.
 *
 * It is still written through `updateVatSettings` — the backend keeps accepting
 * `financialYear` there, marked deprecated, until it gets an endpoint of its own.
 */
export function FinancialYearCard() {
  const t = useTranslations("settings.organization");
  const user = useAuthStore((s) => s.user);
  const updateTaxConfig = useAuthStore((s) => s.updateTaxConfig);
  const { mutateAsync, isPending } = useUpdateVatSettings();

  const canManage = user?.permissions?.includes("organization.edit") ?? false;
  const cfg = user?.organization?.financialYear;

  const [fy, setFy] = useState(() => ({
    startMonth: cfg?.startMonth ?? DEFAULT_FY.startMonth,
    startDay: cfg?.startDay ?? DEFAULT_FY.startDay,
    endMonth: cfg?.endMonth ?? DEFAULT_FY.endMonth,
    endDay: cfg?.endDay ?? DEFAULT_FY.endDay,
  }));

  // Re-sync when fresh server values arrive (e.g. `/me` resolving after mount),
  // keyed on a signature so an in-progress edit is not clobbered.
  const serverSig = JSON.stringify(cfg);
  const [syncedSig, setSyncedSig] = useState(serverSig);
  if (serverSig !== syncedSig) {
    setSyncedSig(serverSig);
    setFy({
      startMonth: cfg?.startMonth ?? DEFAULT_FY.startMonth,
      startDay: cfg?.startDay ?? DEFAULT_FY.startDay,
      endMonth: cfg?.endMonth ?? DEFAULT_FY.endMonth,
      endDay: cfg?.endDay ?? DEFAULT_FY.endDay,
    });
  }

  if (!canManage) return null;

  const handleSave = async () => {
    try {
      const res = await mutateAsync({ financialYear: fy });
      updateTaxConfig({ financialYear: res.data.financialYear });
    } catch {
      // surfaced by the mutation's onError toast
    }
  };

  const field = (key: keyof typeof fy, label: string, max: number) => (
    <div className="space-y-1.5" key={key}>
      <Label htmlFor={key}>{label}</Label>
      <NumberField
        id={key}
        precision={0}
        min={1}
        max={max}
        value={fy[key]}
        onChange={(v) => setFy((p) => ({ ...p, [key]: v ?? 1 }))}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("financialYearTitle")}</CardTitle>
        <CardDescription>{t("financialYearDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {field("startMonth", t("startMonth"), 12)}
          {field("startDay", t("startDay"), 31)}
          {field("endMonth", t("endMonth"), 12)}
          {field("endDay", t("endDay"), 31)}
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? t("saving") : t("save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
