"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { Moon } from "lucide-react";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/services/api";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Switch } from "@/ui/components/switch";

/**
 * Quiet hours — the nightly window in which SMS is held back.
 *
 * The copy has one job: say **held, not dropped**. A merchant who reads this as
 * "messages sent at night are lost" turns it off, which is the opposite of what
 * they want; the backend defers the row to the window's end and sends it in the
 * morning. There is no "quiet hours" reason in the message log for exactly that
 * reason — nothing is ever skipped by it.
 *
 * Email is untouched, and the hint says so: it costs nothing, wakes nobody, and
 * waits in an inbox by design.
 *
 * Hours are the workspace's own local time, resolved server-side from the org
 * timezone — never the browser's, which would silence a merchant's evening
 * because their laptop is set to UTC.
 */

const DEFAULT_WINDOW = { start: 22, end: 8 };

/** 00:00 … 23:00, formatted as the merchant reads a clock, not as an index. */
const hourOptions = Array.from({ length: 24 }, (_, hour) => ({
  label: `${String(hour).padStart(2, "0")}:00`,
  value: String(hour),
}));

export function SmsQuietHours() {
  const t = useTranslations("settings.notifications");
  const { data } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  const quietHours = data?.sms.quietHours;
  const enabled = quietHours !== undefined;
  const window = quietHours ?? DEFAULT_WINDOW;

  /** `null` clears it — an omitted key would mean "leave it alone" instead. */
  const toggle = (checked: boolean) =>
    updateSettings.mutate({
      sms: { quietHours: checked ? DEFAULT_WINDOW : null },
    });

  const setBoundary = (which: "start" | "end") => (value: string) =>
    updateSettings.mutate({
      sms: { quietHours: { ...window, [which]: Number(value) } },
    });

  return (
    <div className="space-y-3 rounded-md border px-3 py-2">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <Label htmlFor="quiet-hours" className="flex items-center gap-2">
            <Moon className="size-3.5" />
            {t("sms.quietHours.title")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t("sms.quietHours.hint")}
          </p>
        </div>
        <Switch
          id="quiet-hours"
          checked={enabled}
          disabled={updateSettings.isPending}
          onCheckedChange={toggle}
        />
      </div>

      {enabled && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("sms.quietHours.from")}
          </span>
          <SimpleSelect
            size="sm"
            className="w-24"
            value={String(window.start)}
            onValueChange={setBoundary("start")}
            options={hourOptions}
          />
          <span className="text-sm text-muted-foreground">
            {t("sms.quietHours.to")}
          </span>
          <SimpleSelect
            size="sm"
            className="w-24"
            value={String(window.end)}
            onValueChange={setBoundary("end")}
            options={hourOptions}
          />
          <span className="text-xs text-muted-foreground">
            {t("sms.quietHours.localTime")}
          </span>
        </div>
      )}
    </div>
  );
}
