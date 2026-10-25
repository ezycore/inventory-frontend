"use client";
// coding-standard: maintained

import { SimpleSelect } from "@/ui/components/simple-select";
import { Switch } from "@/ui/components/switch";
import { useTranslations } from "next-intl";
import Link from "next/link";

/** Mirrors the backend's `INBOX_UNANSWERED_SMS_MINUTES`. */
const WAIT_CHOICES = ["5", "10", "15", "30", "60"] as const;

export interface UnansweredSms {
  enabled: boolean;
  minutes: number;
}

/**
 * "Text me when a customer waits" (backend `docs/plan/notification-bell.md` D13–D14): one SMS to
 * the shop's alert number when a chat the AI handed over has no reply after the wait. This is its
 * only switch — the Notifications matrix shows the row locked and links here. Off by default,
 * because every text spends SMS credit, and the card says where the number and the credit live.
 */
export function UnansweredSmsField({
  value,
  onChange,
}: {
  value: UnansweredSms;
  onChange: (next: UnansweredSms) => void;
}) {
  const t = useTranslations("inbox.settings.ai.unansweredSms");
  return (
    <div className="space-y-2">
      <label className="flex items-start justify-between gap-4">
        <span>
          <span className="block text-sm font-medium">{t("enable")}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{t("hint")}</span>
        </span>
        <Switch checked={value.enabled} onCheckedChange={(enabled) => onChange({ ...value, enabled })} />
      </label>
      {value.enabled && (
        <div className="space-y-1.5 rounded-md border p-3">
          <p className="text-sm">{t("after")}</p>
          <SimpleSelect
            value={String(value.minutes)}
            onValueChange={(minutes) => onChange({ ...value, minutes: Number(minutes) })}
            options={WAIT_CHOICES.map((minutes) => ({ value: minutes, label: t("minutes", { count: Number(minutes) }) }))}
          />
          <p className="text-xs text-muted-foreground">
            {t("where")}{" "}
            <Link href="/settings/notifications" className="text-primary underline-offset-2 hover:underline">
              {t("whereLink")}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
