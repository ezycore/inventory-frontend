"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BarChart3, ChevronDown, ChevronRight } from "lucide-react";
import { useSmsUsage } from "@/services/api";
import type { SmsUsageMonth } from "@/types/api";
import { Button } from "@/ui/components/button";
import { SimpleTable, type SimpleColumn } from "@/ui/components/simple-table";
import { Skeleton } from "@/ui/components/skeleton";

/**
 * "Where did my SMS credit go?" — segments by event, by month.
 *
 * It answers the one question the balance cannot: a merchant who watches 200
 * segments disappear in a week needs to know *which event* is spending them,
 * because the fix is almost always switching one row of the matrix off.
 *
 * Counts only, never money. The per-segment price lives in Mission Control and
 * nowhere else, so a Taka figure here would be a second copy of it that nothing
 * could hold in step.
 *
 * Fetched lazily — the query only runs once the merchant opens the section, so
 * a page that mostly gets visited to flip one toggle does not pay for an
 * aggregation nobody reads.
 */

const MONTHS = 6;

export function SmsUsageReport() {
  const t = useTranslations("settings.notifications");
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useSmsUsage(MONTHS, open);

  const columns: SimpleColumn<{
    eventKey: string;
    messages: number;
    segments: number;
  }>[] = [
    {
      key: "event",
      header: t("sms.usage.event"),
      cell: (row) => t(`events.${row.eventKey}` as never),
    },
    {
      key: "messages",
      header: t("sms.usage.messages"),
      align: "right",
      headClassName: "w-28",
      cell: (row) => row.messages,
    },
    {
      key: "segments",
      header: t("sms.usage.segments"),
      align: "right",
      headClassName: "w-28",
      cell: (row) => row.segments,
    },
  ];

  return (
    <div className="border-t pt-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
        <BarChart3 className="size-3.5" />
        {t("sms.usage.title")}
      </Button>

      {open &&
        (isLoading ? (
          <Skeleton className="mt-3 h-24 w-full" />
        ) : !data || data.months.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("sms.usage.empty")}
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {data.months.map((month: SmsUsageMonth) => (
              <div key={month.month} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium">{month.month}</span>
                  <span className="text-xs text-muted-foreground">
                    {t("sms.usage.monthTotal", {
                      messages: month.messages,
                      segments: month.segments,
                    })}
                  </span>
                </div>
                <div className="overflow-hidden rounded-md border">
                  <SimpleTable
                    columns={columns}
                    rows={month.events}
                    getRowKey={(row) => row.eventKey}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              {t("sms.usage.total", {
                messages: data.totals.messages,
                segments: data.totals.segments,
              })}
            </p>
          </div>
        ))}
    </div>
  );
}
