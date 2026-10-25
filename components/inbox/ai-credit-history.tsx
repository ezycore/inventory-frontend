"use client";
// coding-standard: maintained

import { useOrgCalendar } from "@/hooks/use-org-calendar";
import { formatDate, formatDateOnly } from "@/lib/format";
import { useInboxAiCreditDay, useInboxAiCreditHistory } from "@/services/api";
import { Card } from "@/ui/components/card";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Skeleton } from "@/ui/components/skeleton";
import type { AppLocale } from "@/i18n/config";
import { ChevronDown, ChevronRight, History } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { formatPaisa } from "./ai-credit-card";

/**
 * What the AI spent, per day on the shop's own calendar, and the credit that came in (owner,
 * 2026-10-25). A day opens into its chats, dearest first, each a link to the thread — the
 * questions a merchant asks are "what did I spend yesterday?" and "which chat cost the most?",
 * not a row per reply. Days are `YYYY-MM-DD` keys the backend already cut on the shop's zone.
 */

const PERIODS = [7, 30, 90] as const;

/** A shop-calendar day key ("2026-10-25") as a date — read in UTC so it names that same day. */
const dayLabel = (date: string, locale: AppLocale) => formatDateOnly(`${date}T00:00:00Z`, "EEE, dd MMM", locale);

export function AiCreditHistory() {
  const t = useTranslations("inbox.settings.history");
  const locale = useLocale() as AppLocale;
  const { timezone } = useOrgCalendar();
  const [days, setDays] = useState<number>(30);
  const [open, setOpen] = useState<string | null>(null);
  const { data: history, isLoading } = useInboxAiCreditHistory(days);

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">{t("title")}</h2>
        </div>
        <SimpleSelect
          size="sm"
          className="w-36"
          value={String(days)}
          onValueChange={(value) => {
            setDays(Number(value));
            setOpen(null);
          }}
          options={PERIODS.map((n) => ({ value: String(n), label: t("period", { days: n }) }))}
        />
      </div>

      {isLoading || !history ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {t("totals", { days: history.days, replies: history.totals.replies, amount: formatPaisa(history.totals.paisa) })}
          </p>

          {history.usage.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noUsage")}</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {history.usage.map((day) => (
                <li key={day.date}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
                    aria-expanded={open === day.date}
                    onClick={() => setOpen(open === day.date ? null : day.date)}
                  >
                    {open === day.date ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span className="flex-1">{dayLabel(day.date, locale)}</span>
                    <span className="text-muted-foreground">{t("replies", { count: day.replies })}</span>
                    <span className="w-20 text-right font-medium tabular-nums">{formatPaisa(day.paisa)}</span>
                  </button>
                  {open === day.date && <DayChats date={day.date} />}
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t("creditsTitle")}</h3>
            {history.credits.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("noCredits")}</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {history.credits.map((c) => (
                  <li key={`${c.at}-${c.paisa}`} className="flex flex-wrap items-baseline gap-x-3">
                    <span className="w-28 text-muted-foreground">{formatDate(c.at, "dd MMM yyyy", locale, timezone)}</span>
                    <span className={c.paisa > 0 ? "font-medium text-emerald-700 dark:text-emerald-400" : "font-medium"}>
                      {c.paisa > 0 ? t("added", { amount: formatPaisa(c.paisa) }) : t("removed", { amount: formatPaisa(-c.paisa) })}
                    </span>
                    <span className="text-xs text-muted-foreground">{t("balanceAfter", { amount: formatPaisa(c.balanceAfter) })}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

/** One day's chats, fetched when the day is opened. */
function DayChats({ date }: { date: string }) {
  const t = useTranslations("inbox.settings.history");
  const { data: day, isLoading } = useInboxAiCreditDay(date);

  if (isLoading || !day) return <Skeleton className="mx-3 mb-2 h-10" />;
  return (
    <ul className="space-y-1 bg-muted/30 px-9 py-2 text-sm">
      {day.chats.map((chat) => (
        <li key={chat.conversationId} className="flex items-center gap-2">
          <Link href={`/inbox?chat=${chat.conversationId}`} className="flex-1 truncate text-primary hover:underline">
            {chat.customerName ?? t("unnamed")}
          </Link>
          <span className="text-muted-foreground">{t("replies", { count: chat.replies })}</span>
          <span className="w-20 text-right tabular-nums">{formatPaisa(chat.paisa)}</span>
        </li>
      ))}
      {day.totals.replies > day.chats.reduce((sum, c) => sum + c.replies, 0) && (
        <li className="text-xs text-muted-foreground">{t("moreChats")}</li>
      )}
    </ul>
  );
}
