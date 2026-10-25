"use client";
// coding-standard: maintained

import { useOrgCalendar } from "@/hooks/use-org-calendar";
import type { InboxConnection } from "@/services/api";
import { Button } from "@/ui/components/button";
import { SimpleSelect } from "@/ui/components/simple-select";
import { cn } from "@/ui/lib/utils";
import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

export type AiOffWindow = NonNullable<InboxConnection["aiOffHours"]>[number];

/** Mirrors the backend's `MAX_AI_OFF_WINDOWS` (`services/inbox/ai/inbox-ai-hours.ts`). */
const MAX_WINDOWS = 5;
const NEW_WINDOW: AiOffWindow = { days: [0, 1, 2, 3, 4, 5, 6], start: "10:00", end: "14:00" };

/** "HH:mm" every 15 minutes — the times a merchant actually picks (prayer, lunch, shifts). */
const TIMES = Array.from({ length: 96 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

/**
 * The merchant's AI-off windows (backend plan §3a 22–23): days plus a start and end on the shop's
 * clock. Inside a window the AI sends nothing and the team answers; whatever is still unanswered
 * when it ends gets an AI reply. Days run from the org's own week start.
 */
export function AiOffHoursField({ value, onChange }: { value: AiOffWindow[]; onChange: (next: AiOffWindow[]) => void }) {
  const t = useTranslations("inbox.settings.ai.offHours");
  const { timezone, weekStartDay } = useOrgCalendar();
  const week = Array.from({ length: 7 }, (_, i) => (weekStartDay + i) % 7);

  const timeLabel = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return t("time", { hour: String(h % 12 || 12), minute: String(m).padStart(2, "0"), period: h < 12 ? "am" : "pm" });
  };
  const options = TIMES.map((value) => ({ value, label: timeLabel(value) }));
  const update = (index: number, patch: Partial<AiOffWindow>) =>
    onChange(value.map((w, i) => (i === index ? { ...w, ...patch } : w)));
  const toggleDay = (index: number, day: number) => {
    const days = value[index].days;
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort();
    // A window needs at least one day; removing the last one is what the × button is for.
    if (next.length) update(index, { days: next });
  };

  return (
    <div className="space-y-3">
      {value.map((w, index) => (
        <div key={index} className="space-y-2 rounded-md border p-3">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={t("days")}>
            {week.map((day) => (
              <button
                key={day}
                type="button"
                aria-pressed={w.days.includes(day)}
                onClick={() => toggleDay(index, day)}
                className={cn(
                  "h-8 min-w-10 rounded-full border px-2 text-xs font-medium",
                  w.days.includes(day) ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {t(`day.${day}`)}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SimpleSelect size="sm" className="w-32" value={w.start} onValueChange={(start) => update(index, { start })} options={options} />
            <span className="text-sm text-muted-foreground">{t("to")}</span>
            <SimpleSelect size="sm" className="w-32" value={w.end} onValueChange={(end) => update(index, { end })} options={options} />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="ml-auto h-8 w-8"
              aria-label={t("remove")}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
      {value.length < MAX_WINDOWS && (
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...value, NEW_WINDOW])}>
          <Plus className="mr-1 h-4 w-4" /> {t("add")}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">{t("hint", { timezone })}</p>
    </div>
  );
}
