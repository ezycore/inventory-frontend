"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { useState } from "react";
import { NotificationLog } from "@/components/notifications/notification-log";
import { SmsCreditCard } from "@/components/notifications/sms-credit-card";
import { NotificationMatrix } from "@/components/notifications/notification-matrix";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Checkbox } from "@/ui/components/checkbox";
import PageHeader from "@/ui/components/header";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";

/**
 * Settings → Notifications — the canonical page for the whole product. The
 * Store Settings tab mounts the same matrix scoped to the storefront domain.
 */
export default function NotificationsSettingsPage() {
  const t = useTranslations("settings.notifications");
  const { data } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  // `null` = untouched, so the field shows the server's value; once the user
  // types, the local string wins. Deriving it this way (rather than seeding
  // state from an effect) keeps a refetch from overwriting what is being
  // typed, with no cascading render.
  const [emailEdit, setEmailEdit] = useState<string | null>(null);
  const [phoneEdit, setPhoneEdit] = useState<string | null>(null);
  const email = emailEdit ?? data?.merchantRecipients.email ?? "";
  const phone = phoneEdit ?? data?.merchantRecipients.phone ?? "";

  const saveRecipients = () => {
    updateSettings.mutate({
      merchantRecipients: { email: email.trim(), phone: phone.trim() },
    });
  };

  const toggleOwner = (checked: boolean) => {
    updateSettings.mutate({ merchantRecipients: { alsoNotifyOwner: checked } });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subTitle={t("subtitle")} />

      <Card>
        <CardHeader>
          <CardTitle>{t("recipientsTitle")}</CardTitle>
          <CardDescription>{t("recipientsSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="alert-email">{t("alertEmail")}</Label>
              <Input
                id="alert-email"
                type="email"
                value={email}
                onChange={(e) => setEmailEdit(e.target.value)}
                onBlur={saveRecipients}
              />
              <p className="text-xs text-muted-foreground">
                {t("alertEmailHint")}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alert-phone">{t("alertPhone")}</Label>
              <Input
                id="alert-phone"
                value={phone}
                onChange={(e) => setPhoneEdit(e.target.value)}
                onBlur={saveRecipients}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="also-owner"
              checked={data?.merchantRecipients.alsoNotifyOwner ?? true}
              onCheckedChange={(v) => toggleOwner(v === true)}
            />
            <Label htmlFor="also-owner" className="font-normal">
              {t("alsoNotifyOwner")}
            </Label>
          </div>
        </CardContent>
      </Card>

      <SmsCreditCard />

      <Card>
        <CardContent className="pt-6">
          <NotificationMatrix />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("log.title")}</CardTitle>
          <CardDescription>{t("log.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationLog />
        </CardContent>
      </Card>
    </div>
  );
}
