"use client";
// coding-standard: maintained
import { useLocale, useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/services/api";
import { formatDate } from "@/lib/format";
import { useOrgCalendar } from "@/hooks/use-org-calendar";
import { SmsCreditTerms } from "@/components/notifications/sms-credit-terms";
import { SmsQuietHours } from "@/components/notifications/sms-quiet-hours";
import { SmsTestRow } from "@/components/notifications/sms-test-row";
import { SmsUsageReport } from "@/components/notifications/sms-usage-report";
import type { AppLocale } from "@/i18n/config";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
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
 *
 * The self-test lives in `<SmsTestRow>` — it owns its own number field, and it
 * sends a REAL, CHARGED message.
 */
export function SmsCreditCard() {
  const t = useTranslations("settings.notifications");
  const locale = useLocale() as AppLocale;
  const { timezone } = useOrgCalendar();
  const { data, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  const sms = data?.sms;
  const balance = sms?.balance ?? 0;
  const available = sms?.available === true;
  const enabled = sms?.enabled === true;
  // `expired` is computed by the server, not by comparing the date here: a
  // device with the wrong clock would otherwise disagree with the send guard
  // and tell the merchant they have credit the backend refuses to spend.
  const expired = sms?.expired === true;

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
            {sms?.expiresAt && !expired && (
              <p className="text-xs text-muted-foreground">
                {t("sms.validUntil", {
                  date: formatDate(sms.expiresAt, "dd MMM yyyy", locale, timezone),
                })}
              </p>
            )}
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

        {available && expired && balance > 0 && (
          // Distinct from an empty balance on purpose: the segments are still
          // there and the fix is a top-up to restart the clock, not "buy more
          // of what you already have".
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
            {t("sms.expired")}
          </div>
        )}

        {available && balance === 0 && (
          // Deliberately not framed as an error: email is unaffected, and
          // saying so stops a merchant assuming notifications are broken.
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
            {t("sms.empty")}
          </div>
        )}

        {available && enabled && <SmsQuietHours />}

        {available && enabled && (
          <SmsTestRow
            alertPhone={data?.merchantRecipients.phone ?? ""}
            disabled={balance === 0 || expired}
          />
        )}

        <p className="text-xs text-muted-foreground">
          {t("sms.topUp")}{" "}
          <Badge variant="secondary" className="text-[10px]">
            {t("sms.nonRefundable")}
          </Badge>
        </p>

        {/* The price and the full terms, straight from Mission Control. Shown
            to every merchant with SMS on their plan, not only at the moment of
            purchase: there is no self-serve checkout yet, so this card is the
            only place they can go back and re-read what they bought. */}
        {sms?.terms && <SmsCreditTerms terms={sms.terms} />}

        {available && <SmsUsageReport />}
      </CardContent>
    </Card>
  );
}
