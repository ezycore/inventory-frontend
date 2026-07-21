"use client";
// coding-standard: maintained

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Lock } from "lucide-react";

import { useAuthStore } from "@/services/stores";
import { useUpdateVatSettings } from "@/services/api";
import { vatRegistrationOf } from "@/lib/feature-utils";
import type { VatRegistrationType } from "@/types";
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
import { NumberField } from "@/ui/components/number-field";
import { DatePicker } from "@/ui/components/date-picker";
import { Label } from "@/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
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
import { describeVatPeriodSplit } from "@/lib/vat-period-split";

const REGISTRATION_TYPES: VatRegistrationType[] = [
  "standard_15",
  "reduced",
  "turnover_4",
  "exempt",
  "unregistered",
];

/** Only a standard-rated registrant may reclaim input VAT. */
const CLAIMS_REBATE: VatRegistrationType = "standard_15";

const today = () => new Date().toISOString().slice(0, 10);

export default function VatSettingsPage() {
  const t = useTranslations("settings.vatSettings");
  const tShell = useTranslations("settings.shell");
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const updateTaxConfig = useAuthStore((s) => s.updateTaxConfig);
  const { mutateAsync, isPending } = useUpdateVatSettings();

  const masterVatOn = user?.organization?.features?.tax ?? false;
  const canManage = user?.permissions?.includes("organization.edit") ?? false;

  const vs = user?.organization?.vatSettings;
  const currentType = vatRegistrationOf(user?.organization);

  const [type, setType] = useState<VatRegistrationType>(currentType);
  const [effectiveFrom, setEffectiveFrom] = useState<string>(today());
  const [bin, setBin] = useState(vs?.bin ?? "");
  const [pricesIncludeVat, setPricesIncludeVat] = useState(
    vs?.pricesIncludeVat ?? true,
  );
  const [filingDay, setFilingDay] = useState<number | null>(
    vs?.filingDayOfMonth ?? 15,
  );
  // A registration change is appended, never edited, and re-treats every
  // document from `effectiveFrom` on. Confirm it explicitly rather than letting
  // a dropdown quietly redefine the month. Declared with the other hooks — it
  // must not sit after the `!canManage` early return.
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Re-sync when fresh server values land (e.g. `/me` after mount). Keyed on a
  // signature so in-progress edits aren't clobbered — same pattern the previous
  // page used.
  const serverSig = JSON.stringify({ vs, currentType });
  const [syncedSig, setSyncedSig] = useState(serverSig);
  if (serverSig !== syncedSig) {
    setSyncedSig(serverSig);
    setType(currentType);
    setBin(vs?.bin ?? "");
    setPricesIncludeVat(vs?.pricesIncludeVat ?? true);
    setFilingDay(vs?.filingDayOfMonth ?? 15);
  }

  useEffect(() => {
    if (user && !canManage) {
      toast.error(tShell("noPermission"));
      router.push("/");
    }
  }, [user, canManage, router, tShell]);

  if (!canManage) return null;

  const typeChanged = type !== currentType;
  const split = describeVatPeriodSplit(effectiveFrom);

  const handleSave = async () => {
    try {
      const res = await mutateAsync({
        vatSettings: {
          bin: bin.trim() || undefined,
          pricesIncludeVat,
          filingDayOfMonth: filingDay ?? 15,
        },
        // Only send a registration change when the type actually changed —
        // every send appends a history entry, and the history is the audit trail.
        ...(typeChanged && { registration: { type, effectiveFrom } }),
      });
      updateTaxConfig({
        vatSettings: res.data.vatSettings,
        vatRegistrationHistory: res.data.vatRegistrationHistory,
      });
    } catch {
      // surfaced by the mutation's onError toast
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subTitle={t("subtitle")} />

      {!masterVatOn && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 py-4">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">{t("offTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("offBody")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("registrationTitle")}</CardTitle>
          <CardDescription>{t("registrationDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="vat-type">{t("typeLabel")}</Label>
            <Select
              value={type}
              disabled={!masterVatOn}
              onValueChange={(v) => setType(v as VatRegistrationType)}
            >
              <SelectTrigger id="vat-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGISTRATION_TYPES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`types.${value}.label`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {t(`types.${type}.hint`)}
            </p>
          </div>

          {/* The effective date is the whole point: registration and
              de-registration both carry an NBR date, routinely mid-month. */}
          {typeChanged && (
            <div className="space-y-1.5">
              <Label htmlFor="vat-effective-from">
                {t("effectiveFromLabel")}
              </Label>
              <DatePicker
                date={effectiveFrom}
                onSelect={(v) => setEffectiveFrom(v ?? today())}
              />
              <p className="text-sm text-muted-foreground">
                {t("effectiveFromHint")}
              </p>
            </div>
          )}

          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-sm">
              {type === CLAIMS_REBATE ? t("rebateYes") : t("rebateNo")}
            </p>
          </div>

          {type !== "unregistered" && (
            <div className="space-y-1.5">
              <Label htmlFor="vat-bin">{t("binLabel")}</Label>
              <Input
                id="vat-bin"
                value={bin}
                maxLength={20}
                disabled={!masterVatOn}
                placeholder={t("binPlaceholder")}
                onChange={(e) => setBin(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">{t("binHint")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("pricingTitle")}</CardTitle>
          <CardDescription>{t("pricingDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t("pricesIncludeVatLabel")}</p>
              <p className="text-sm text-muted-foreground">
                {t("pricesIncludeVatHint")}
              </p>
            </div>
            <Switch
              checked={pricesIncludeVat}
              disabled={!masterVatOn}
              onCheckedChange={setPricesIncludeVat}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("filingTitle")}</CardTitle>
          <CardDescription>{t("filingDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* The VAT period is always a calendar month — not configurable. */}
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-sm">{t("periodFixed")}</p>
          </div>
          <div className="space-y-1.5 sm:max-w-[200px]">
            <Label htmlFor="filing-day">{t("filingDayLabel")}</Label>
            <NumberField
              id="filing-day"
              precision={0}
              min={1}
              max={28}
              value={filingDay}
              disabled={!masterVatOn}
              onChange={setFilingDay}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => (typeChanged ? setConfirmOpen(true) : handleSave())}
          disabled={isPending}
        >
          {isPending ? t("saving") : t("save")}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm.title")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {t("confirm.body", {
                    from: t(`types.${currentType}.label`),
                    to: t(`types.${type}.label`),
                    date: effectiveFrom,
                  })}
                </p>
                {/* The split is the part people do not expect: one calendar
                    month ends up with two VAT treatments. */}
                {split.isMidPeriod && (
                  <p className="rounded-md border bg-muted/40 p-3 text-sm">
                    {t("confirm.split", {
                      month: split.monthKey,
                      firstDay: 1,
                      lastOld: split.effectiveDay - 1,
                      firstNew: split.effectiveDay,
                      lastDay: split.lastDay,
                    })}
                  </p>
                )}
                <p className="font-medium">{t("confirm.immutable")}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>
              {t("confirm.apply")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
