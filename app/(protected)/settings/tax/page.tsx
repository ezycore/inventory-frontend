"use client";
// coding-standard: maintained

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock } from "lucide-react";

import { useAuthStore } from "@/services/stores";
import { useUpdateTaxSettings } from "@/services/api";
import { isTaxActive } from "@/lib/feature-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import PageHeader from "@/ui/components/header";
import { Switch } from "@/ui/components/switch";
import { Button } from "@/ui/components/button";
import { NumberField } from "@/ui/components/number-field";
import { Label } from "@/ui/components/label";

const DEFAULT_FY = { startMonth: 7, startDay: 1, endMonth: 6, endDay: 30 };

export default function TaxSettingsPage() {
  const t = useTranslations("settings.taxSettings");
  const tShell = useTranslations("settings.shell");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateTaxConfig = useAuthStore((s) => s.updateTaxConfig);
  const { mutateAsync, isPending } = useUpdateTaxSettings();

  const masterTaxOn = user?.organization?.features?.tax ?? false;
  const canManage = user?.permissions?.includes("organization.edit") ?? false;

  const ts = user?.organization?.taxSettings;
  const fyCfg = user?.organization?.financialYear;

  const [salesEnabled, setSalesEnabled] = useState(ts?.salesEnabled ?? true);
  const [purchaseEnabled, setPurchaseEnabled] = useState(
    ts?.purchaseEnabled ?? true,
  );
  const [fy, setFy] = useState(() => ({
    startMonth: fyCfg?.startMonth ?? DEFAULT_FY.startMonth,
    startDay: fyCfg?.startDay ?? DEFAULT_FY.startDay,
    endMonth: fyCfg?.endMonth ?? DEFAULT_FY.endMonth,
    endDay: fyCfg?.endDay ?? DEFAULT_FY.endDay,
  }));

  // Re-sync the form when fresh server values arrive (e.g. after `/me` updates
  // the store post-mount). React-sanctioned "adjust state during render" — keyed
  // on a signature of the server values so user edits aren't clobbered.
  const serverSig = JSON.stringify({ ts, fyCfg });
  const [syncedSig, setSyncedSig] = useState(serverSig);
  if (serverSig !== syncedSig) {
    setSyncedSig(serverSig);
    setSalesEnabled(ts?.salesEnabled ?? true);
    setPurchaseEnabled(ts?.purchaseEnabled ?? true);
    setFy({
      startMonth: fyCfg?.startMonth ?? DEFAULT_FY.startMonth,
      startDay: fyCfg?.startDay ?? DEFAULT_FY.startDay,
      endMonth: fyCfg?.endMonth ?? DEFAULT_FY.endMonth,
      endDay: fyCfg?.endDay ?? DEFAULT_FY.endDay,
    });
  }

  // Redirect users without the manage permission.
  useEffect(() => {
    if (user && !canManage) {
      toast.error(tShell("noPermission"));
      router.push("/");
    }
  }, [user, canManage, router, tShell]);

  if (!canManage) return null;

  const handleSave = async () => {
    try {
      const res = await mutateAsync({
        taxSettings: { salesEnabled, purchaseEnabled },
        financialYear: fy,
      });
      updateTaxConfig({
        taxSettings: res.data.taxSettings,
        financialYear: res.data.financialYear,
      });
    } catch {
      // surfaced by the mutation's onError toast
    }
  };

  const fyField = (
    key: keyof typeof fy,
    label: string,
    max: number,
  ) => (
    <div className="space-y-1.5">
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
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
      />

      {!masterTaxOn && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 py-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("offTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("offBody")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("whereTitle")}</CardTitle>
          <CardDescription>
            {t("whereDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("salesLabel")}</p>
              <p className="text-sm text-muted-foreground">
                {t("salesHint")}
              </p>
            </div>
            <Switch
              checked={masterTaxOn && salesEnabled}
              disabled={!masterTaxOn}
              onCheckedChange={setSalesEnabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("purchaseLabel")}</p>
              <p className="text-sm text-muted-foreground">
                {t("purchaseHint")}
              </p>
            </div>
            <Switch
              checked={masterTaxOn && purchaseEnabled}
              disabled={!masterTaxOn}
              onCheckedChange={setPurchaseEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("financialYearTitle")}</CardTitle>
          <CardDescription>
            {t("financialYearDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {fyField("startMonth", t("startMonth"), 12)}
          {fyField("startDay", t("startDay"), 31)}
          {fyField("endMonth", t("endMonth"), 12)}
          {fyField("endDay", t("endDay"), 31)}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? t("saving") : t("save")}
        </Button>
      </div>
    </div>
  );
}
