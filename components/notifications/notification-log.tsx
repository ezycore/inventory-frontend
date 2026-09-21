"use client";
// coding-standard: maintained
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Mail, MessageSquare, RotateCw } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { useOrgCalendar } from "@/hooks/use-org-calendar";
import {
  useNotificationLog,
  useNotificationSettings,
  useResendNotification,
} from "@/services/api";
import type { AppLocale } from "@/i18n/config";
import type { NotificationLogItem } from "@/types/api";
import { TablePager } from "@/components/shared/table-pager";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { SimpleSelect } from "@/ui/components/simple-select";
import { SimpleTable, type SimpleColumn } from "@/ui/components/simple-table";
import { Skeleton } from "@/ui/components/skeleton";

const PAGE_SIZE = 20;
const ALL = "all";

/**
 * Which rows the backend will actually re-queue. Mirrored here so the button
 * only appears where it works — an always-visible Resend that answers 400 on
 * most rows teaches merchants to ignore it.
 *
 * A dispatcher-level skip (`channel_off`, `suppressed`, `consent`, …) is
 * missing from this list for a concrete reason, not a policy one: those rows
 * were never given a recipient address, so there is nowhere to resend them to.
 * The fix for those is to remove the cause and let the next event send.
 */
const RESENDABLE_SKIP_REASONS = new Set(["no_credit", "credit_expired"]);

const canResend = (row: NotificationLogItem): boolean =>
  row.status === "failed" ||
  (row.status === "skipped" &&
    row.skipReason !== undefined &&
    RESENDABLE_SKIP_REASONS.has(row.skipReason));

/** Badge tone per status — `sent` is the only success state. */
const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  sent: "default",
  pending: "secondary",
  processing: "secondary",
  failed: "destructive",
  skipped: "outline",
};

/**
 * The notification log — every message the engine produced, including the ones
 * it deliberately did NOT send and why.
 *
 * This is the answer to "the customer says they never got it", so the *skipped*
 * rows matter more than the sent ones: a `no_recipient` or `suppressed` reason
 * turns an invisible non-event into something a merchant can act on.
 *
 * It never shows the real address or the message body — the backend projects
 * both away (a rendered body can carry a live password-reset URL). The masked
 * recipient and the subject are the whole display surface.
 */
export function NotificationLog() {
  const t = useTranslations("settings.notifications");
  const locale = useLocale() as AppLocale;
  const { timezone } = useOrgCalendar();
  const { data: settings } = useNotificationSettings();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(ALL);
  const [channel, setChannel] = useState(ALL);
  const [eventKey, setEventKey] = useState(ALL);
  const resend = useResendNotification();
  // Tracked per row, not off `isPending` alone: the mutation is shared by every
  // row, so a single flag would spin all of them.
  const [resendingId, setResendingId] = useState<string | null>(null);

  const { data, isLoading } = useNotificationLog({
    page,
    limit: PAGE_SIZE,
    ...(status !== ALL ? { status } : {}),
    ...(channel !== ALL ? { channel: channel as "email" | "sms" } : {}),
    ...(eventKey !== ALL ? { eventKey } : {}),
  });

  /** Changing a filter invalidates the current page number, not just the rows. */
  const applyFilter = (set: (value: string) => void) => (value: string) => {
    set(value);
    setPage(1);
  };

  const statusOptions = [
    { label: t("log.filters.allStatuses"), value: ALL },
    ...["sent", "pending", "failed", "skipped"].map((value) => ({
      label: t(`log.status.${value}` as never),
      value,
    })),
  ];

  const channelOptions = [
    { label: t("log.filters.allChannels"), value: ALL },
    { label: t("channels.email"), value: "email" },
    { label: t("channels.sms"), value: "sms" },
  ];

  // The event list comes from the settings matrix, which the API already
  // filtered to this org's features — so the dropdown can never offer an event
  // the workspace cannot produce.
  const eventOptions = [
    { label: t("log.filters.allEvents"), value: ALL },
    ...(settings?.events ?? []).map((row) => ({
      label: t(`events.${row.key}` as never),
      value: row.key,
    })),
  ];

  const rows = data?.items ?? [];

  const columns: SimpleColumn<NotificationLogItem>[] = [
    {
      key: "when",
      header: t("log.columns.when"),
      headClassName: "w-44",
      cell: (row) => (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatDateTime(row.createdAt, locale, timezone)}
        </span>
      ),
    },
    {
      key: "event",
      header: t("log.columns.event"),
      cell: (row) => (
        <div className="min-w-0">
          <div className="font-medium">
            {t(`events.${row.eventKey}` as never)}
          </div>
          {row.subject && (
            <div className="truncate text-xs text-muted-foreground">
              {row.subject}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "recipient",
      header: t("log.columns.recipient"),
      cell: (row) => (
        <div className="min-w-0">
          <div className="text-sm">{row.recipient}</div>
          <div className="text-xs text-muted-foreground">
            {t(`audiences.${row.audience}`)}
          </div>
        </div>
      ),
    },
    {
      key: "channel",
      header: t("log.columns.channel"),
      headClassName: "w-24",
      cell: (row) => (
        <span className="flex items-center gap-1.5 text-sm">
          {row.channel === "email" ? (
            <Mail className="size-3.5 text-muted-foreground" />
          ) : (
            <MessageSquare className="size-3.5 text-muted-foreground" />
          )}
          {t(`channels.${row.channel}`)}
        </span>
      ),
    },
    {
      key: "status",
      header: t("log.columns.status"),
      headClassName: "w-52",
      cell: (row) => (
        <div className="space-y-1">
          <Badge variant={STATUS_VARIANT[row.status] ?? "outline"}>
            {t(`log.status.${row.status}` as never)}
          </Badge>
          {/* A skip reason is the whole point of the row — a send that never
              happened is otherwise indistinguishable from one that did. */}
          {row.skipReason && (
            <p className="text-xs text-muted-foreground">
              {t(`log.skipReasons.${row.skipReason}` as never)}
            </p>
          )}
          {row.error && !row.skipReason && (
            <p className="text-xs text-destructive">{row.error}</p>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      headClassName: "w-28",
      align: "right",
      cell: (row) =>
        canResend(row) ? (
          <Button
            size="sm"
            variant="outline"
            disabled={resend.isPending}
            onClick={() => {
              setResendingId(String(row._id));
              resend.mutate(String(row._id), {
                onSettled: () => setResendingId(null),
              });
            }}
          >
            <RotateCw
              className={`size-3.5 ${
                resendingId === String(row._id) ? "animate-spin" : ""
              }`}
            />
            {t("log.resend")}
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <SimpleSelect
          size="sm"
          className="w-44"
          value={eventKey}
          onValueChange={applyFilter(setEventKey)}
          options={eventOptions}
        />
        <SimpleSelect
          size="sm"
          className="w-36"
          value={status}
          onValueChange={applyFilter(setStatus)}
          options={statusOptions}
        />
        <SimpleSelect
          size="sm"
          className="w-32"
          value={channel}
          onValueChange={applyFilter(setChannel)}
          options={channelOptions}
        />
      </div>

      {/* Said once, above the rows, rather than on every button: a resend is
          the same charge as the original send, and a merchant clearing a
          backlog of failures should know that before the first click. */}
      {rows.some((row) => canResend(row) && row.channel === "sms") && (
        <p className="text-xs text-muted-foreground">{t("log.resendHint")}</p>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("log.empty")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <div className="overflow-x-auto">
            <SimpleTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => String(row._id)}
            />
          </div>
          <TablePager
            page={data?.page ?? 1}
            limit={data?.limit ?? PAGE_SIZE}
            total={data?.total ?? 0}
            totalPages={data?.totalPages ?? 1}
            hasPrev={data?.hasPrev}
            hasNext={data?.hasNext}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
