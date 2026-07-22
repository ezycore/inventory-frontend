"use client";
// coding-standard: maintained

import { useLocale, useTranslations } from "next-intl";
import { Clock, Mail } from "lucide-react";
import { Label } from "@/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Switch } from "@/ui/components/switch";
import { formatDate } from "@/lib/format";
import type { AppLocale } from "@/i18n/config";

// "21" → "9:00 PM" (locale-aware AM/PM) for the send-hour dropdown.
const hourLabel = (hour: number, locale: AppLocale) =>
  formatDate(new Date(2000, 0, 1, hour, 0), "h:mm a", locale);
const REPORT_HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/** One report's schedule as the form holds it (`hour` is the Select's string value). */
export interface EmailReportSchedule {
  enabled: boolean;
  hour: string;
}

interface ReportRowProps {
  /** Field name — also the flat backend key prefix (`<id>Enabled` / `<id>Hour`). */
  id: string;
  label: string;
  hint: string;
  schedule: EmailReportSchedule;
  onChange: (schedule: EmailReportSchedule) => void;
}

/** Toggle + send-hour pair for a single recurring report email. */
function ReportRow({ id, label, hint, schedule, onChange }: ReportRowProps) {
  const t = useTranslations("settings.organization.tab");
  const locale = useLocale() as AppLocale;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex items-center justify-between gap-3 rounded-md border p-3">
        <div className="space-y-0.5">
          <Label htmlFor={`${id}Enabled`}>{label}</Label>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <Switch
          id={`${id}Enabled`}
          checked={schedule.enabled}
          onCheckedChange={(enabled) => onChange({ ...schedule, enabled })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${id}Hour`} className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {t("sendAt")}
        </Label>
        <Select
          value={schedule.hour}
          onValueChange={(hour) => onChange({ ...schedule, hour })}
          disabled={!schedule.enabled}
        >
          <SelectTrigger id={`${id}Hour`} className="w-full">
            <SelectValue placeholder={t("sendAtPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {REPORT_HOURS.map((hour) => (
              <SelectItem key={hour} value={String(hour)}>
                {hourLabel(hour, locale)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t("sendAtHint")}</p>
      </div>
    </div>
  );
}

interface EmailReportsSectionProps {
  salesDigest: EmailReportSchedule;
  expiryDigest: EmailReportSchedule;
  /** Expiry report row is only shown when the org has the expiryTracking feature. */
  showExpiryDigest: boolean;
  onSalesDigestChange: (schedule: EmailReportSchedule) => void;
  onExpiryDigestChange: (schedule: EmailReportSchedule) => void;
}

/** "Email Reports" block of Settings → Organization: one row per recurring report. */
export function EmailReportsSection({
  salesDigest,
  expiryDigest,
  showExpiryDigest,
  onSalesDigestChange,
  onExpiryDigestChange,
}: EmailReportsSectionProps) {
  const t = useTranslations("settings.organization.tab");

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Mail className="h-4 w-4" />
        <span>{t("emailReportsSectionLabel")}</span>
      </div>

      <ReportRow
        id="salesDigest"
        label={t("dailyDigest")}
        hint={t("dailyDigestHint")}
        schedule={salesDigest}
        onChange={onSalesDigestChange}
      />

      {showExpiryDigest && (
        <ReportRow
          id="expiryDigest"
          label={t("expiryReport")}
          hint={t("expiryReportHint")}
          schedule={expiryDigest}
          onChange={onExpiryDigestChange}
        />
      )}
    </div>
  );
}
