"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/services/api";
import { Badge } from "@/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Label } from "@/ui/components/label";
import { Skeleton } from "@/ui/components/skeleton";
import { Switch } from "@/ui/components/switch";

/**
 * The SMS credit card — balance, the master switch, and this month's usage.
 *
 * Three things can stop an SMS, and the merchant needs to know **which one**,
 * because each has a different fix:
 *
 * - the plan does not include SMS  → talk to us
 * - the master switch is off       → flip it here
 * - the balance is empty           → top up
 *
 * Collapsing them into one "SMS unavailable" message is what turns a
 * thirty-second fix into a support ticket.
 *
 * There is no self-serve checkout yet (notifications plan Phase 3.5 is
 * deferred), so topping up is deliberately a "contact us" instruction rather
 * than a button that would 404.
 */
export function SmsCreditCard() {
  const t = useTranslations("settings.notifications");
  const { data, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  const sms = data?.sms;
  const balance = sms?.balance ?? 0;
  const available = sms?.available === true;
  const enabled = sms?.enabled === true;

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="size-4" />
          {t("sms.title")}
        </CardTitle>
        <CardDescription>{t("sms.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-8">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold">{balance}</span>
              <span className="text-sm text-muted-foreground">
                {t("sms.remaining")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{t("sms.segmentHint")}</p>
          </div>
          {sms?.monthlyCap ? (
            <div>
              <div className="text-lg font-medium">
                {sms.sentThisMonth ?? 0}
                <span className="text-sm text-muted-foreground">
                  {" / "}
                  {sms.monthlyCap}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("sms.thisMonth")}
              </p>
            </div>
          ) : (
            <div>
              <div className="text-lg font-medium">{sms?.sentThisMonth ?? 0}</div>
              <p className="text-xs text-muted-foreground">
                {t("sms.thisMonth")}
              </p>
            </div>
          )}
        </div>

        {!available ? (
          // The plan gate. Nothing the merchant can do here, so don't offer a
          // switch that would do nothing.
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
            {t("sms.notOnPlan")}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
            <div className="space-y-0.5">
              <Label htmlFor="sms-enabled">{t("sms.enable")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("sms.enableHint")}
              </p>
            </div>
            <Switch
              id="sms-enabled"
              checked={enabled}
              disabled={updateSettings.isPending}
              onCheckedChange={(checked) =>
                updateSettings.mutate({ sms: { enabled: checked } })
              }
            />
          </div>
        )}

        {available && balance === 0 && (
          // Deliberately not framed as an error: email is unaffected, and
          // saying so stops a merchant assuming notifications are broken.
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
            {t("sms.empty")}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {t("sms.topUp")}{" "}
          <Badge variant="secondary" className="text-[10px]">
            {t("sms.nonRefundable")}
          </Badge>
        </p>
      </CardContent>
    </Card>
  );
}
