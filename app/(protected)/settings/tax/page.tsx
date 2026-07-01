"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";

const DEFAULT_FY = { startMonth: 7, startDay: 1, endMonth: 6, endDay: 30 };

export default function TaxSettingsPage() {
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
      toast.error("You don't have permission to access this page");
      router.push("/");
    }
  }, [user, canManage, router]);

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
      <Input
        id={key}
        type="number"
        min={1}
        max={max}
        value={fy[key]}
        onChange={(e) =>
          setFy((p) => ({ ...p, [key]: Number(e.target.value) || 1 }))
        }
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Settings"
        subTitle="Control where tax applies and set your financial year for tax reporting."
      />

      {!masterTaxOn && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 py-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Tax is off for your plan</p>
              <p className="text-sm text-muted-foreground">
                The Tax feature is managed by your subscription. These sub-toggles
                only take effect once Tax is enabled on your plan.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Where tax applies</CardTitle>
          <CardDescription>
            Returns automatically follow their parent area.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sales tax</p>
              <p className="text-sm text-muted-foreground">
                Apply tax on sales and sales returns.
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
              <p className="text-sm font-medium">Purchase tax</p>
              <p className="text-sm text-muted-foreground">
                Apply tax on purchases and purchase returns.
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
          <CardTitle className="text-base">Financial year</CardTitle>
          <CardDescription>
            Used as the default range for tax reports (1-based month/day).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {fyField("startMonth", "Start month", 12)}
          {fyField("startDay", "Start day", 31)}
          {fyField("endMonth", "End month", 12)}
          {fyField("endDay", "End day", 31)}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
