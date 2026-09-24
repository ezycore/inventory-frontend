"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Mail, MessageSquare } from "lucide-react";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/services/api";
import type { NotificationEventRow } from "@/types/api";
import { NotificationChannelCell } from "@/components/notifications/notification-channel-cell";
import { NotificationEventCell } from "@/components/notifications/notification-event-cell";
import { SmsTemplateSheet } from "@/components/notifications/sms-template-sheet";
import { SimpleTable, type SimpleColumn } from "@/ui/components/simple-table";
import { Skeleton } from "@/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/ui/components/tabs";

type Audience = "customer" | "merchant";
type Channel = "email" | "sms";

const AUDIENCES: Audience[] = ["customer", "merchant"];
const CHANNELS: Channel[] = ["email", "sms"];

/**
 * The email templates to echo back when a toggle replaces the event's stored
 * config. SMS wording is deliberately NOT echoed: only the SMS editor's own
 * endpoint writes it, and the server keeps it through this save regardless.
 */
const emailTemplates = (row: NotificationEventRow) => {
  const { emailSubject, emailBody } = row.templates ?? {};
  return emailSubject || emailBody
    ? { templates: { emailSubject, emailBody } }
    : {};
};

interface NotificationMatrixProps {
  /** Restrict to these domains; omit for every domain the org has. */
  domains?: NotificationEventRow["domain"][];
  /** Hide the domain tab bar (a single-domain mount doesn't need it). */
  hideDomainTabs?: boolean;
}

/**
 * The registry-driven notification matrix: rows are events, columns are
 * Email/SMS per audience. Mounted twice — the canonical Settings →
 * Notifications page (all domains) and the Store Settings tab
 * (`domains={["storefront"]}`).
 *
 * The event catalogue is NOT declared here. The backend registry is the single
 * source of truth and the API serves the effective matrix (defaults overlaid
 * with the org's overrides, feature-gated events already omitted), so adding an
 * event never touches this file.
 */
export function NotificationMatrix({
  domains,
  hideDomainTabs,
}: NotificationMatrixProps) {
  const t = useTranslations("settings.notifications");
  const { data, isLoading } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();
  const [activeDomain, setActiveDomain] = useState<string>("all");
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const events = useMemo(() => {
    const rows = data?.events ?? [];
    return domains ? rows.filter((row) => domains.includes(row.domain)) : rows;
  }, [data?.events, domains]);

  const availableDomains = useMemo(
    () => [...new Set(events.map((row) => row.domain))],
    [events],
  );

  const visible = useMemo(
    () =>
      activeDomain === "all"
        ? events
        : events.filter((row) => row.domain === activeDomain),
    [events, activeDomain],
  );

  const editingRow = events.find((row) => row.key === editingKey);

  // The SMS column renders always, but a box is only usable once the plan
  // grants SMS AND the merchant has flipped the master switch — the credit
  // balance is checked at send time, not here, because a merchant should be
  // able to configure SMS before topping up.
  const smsAvailable =
    data?.sms.enabled === true && data?.sms.available === true;

  const toggle = (row: NotificationEventRow, audience: Audience, channel: Channel) => {
    const current = row.channels[audience];
    if (!current) return;
    updateSettings.mutate({
      events: {
        [row.key]: {
          // Send the whole audience block: the PATCH replaces an event's
          // config wholesale, so omitting the other channel would clear it.
          ...(row.channels.customer
            ? { customer: { ...row.channels.customer } }
            : {}),
          ...(row.channels.merchant
            ? { merchant: { ...row.channels.merchant } }
            : {}),
          [audience]: { ...current, [channel]: !current[channel] },
          ...emailTemplates(row),
          ...(row.schedule ? { schedule: row.schedule } : {}),
        },
      },
    });
  };

  /**
   * Scheduled digests (the daily sales summary, the expiry report) carry an
   * org-local hour. The backend always sends a resolved value, so this never
   * has to know the default — which is what stops the picker and the job
   * disagreeing about when "unset" means.
   */
  const setHour = (row: NotificationEventRow, hour: number) => {
    updateSettings.mutate({
      events: {
        [row.key]: {
          ...(row.channels.customer
            ? { customer: { ...row.channels.customer } }
            : {}),
          ...(row.channels.merchant
            ? { merchant: { ...row.channels.merchant } }
            : {}),
          ...emailTemplates(row),
          schedule: { hour },
        },
      },
    });
  };

  const columns: SimpleColumn<NotificationEventRow>[] = [
    {
      key: "event",
      header: t("columns.event"),
      cell: (row) => (
        <NotificationEventCell
          row={row}
          canEditSms={data?.sms.available === true}
          onEditSms={() => setEditingKey(row.key)}
          onSetHour={(hour) => setHour(row, hour)}
        />
      ),
    },
    ...AUDIENCES.flatMap((audience) =>
      CHANNELS.map(
        (channel): SimpleColumn<NotificationEventRow> => ({
          key: `${audience}-${channel}`,
          align: "center",
          headClassName: "w-24",
          cellClassName: "w-24",
          header: (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {t(`audiences.${audience}`)}
              </span>
              <span className="flex items-center gap-1 text-xs">
                {channel === "email" ? (
                  <Mail className="size-3" />
                ) : (
                  <MessageSquare className="size-3" />
                )}
                {t(`channels.${channel}`)}
              </span>
            </div>
          ),
          cell: (row) => (
            <NotificationChannelCell
              row={row}
              audience={audience}
              channel={channel}
              smsAvailable={smsAvailable}
              pending={updateSettings.isPending}
              onToggle={() => toggle(row, audience, channel)}
            />
          ),
        }),
      ),
    ),
  ];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("emptyEvents")}</p>
    );
  }

  return (
    <div className="space-y-4">
      {!hideDomainTabs && availableDomains.length > 1 && (
        <Tabs value={activeDomain} onValueChange={setActiveDomain}>
          {/* One nowrap trigger per domain overruns a phone viewport, and nothing clips
              a `w-fit` TabsList — the whole page scrolls sideways instead. Scroll the
              strip on its own. */}
          <div className="overflow-x-auto pb-1">
            <TabsList className="w-max">
              <TabsTrigger value="all">{t("domains.all")}</TabsTrigger>
              {availableDomains.map((domain) => (
                <TabsTrigger key={domain} value={domain}>
                  {t(`domains.${domain}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      )}

      {/* No scroll wrapper here: `Table` already renders its own
          `w-full overflow-x-auto` container, and nesting a second one just adds a
          dead outer scroller that never moves. */}
      <SimpleTable
        columns={columns}
        rows={visible}
        getRowKey={(row) => row.key}
      />

      {editingRow && (
        <SmsTemplateSheet
          key={editingRow.key}
          row={editingRow}
          eventLabel={t(`events.${editingRow.key}` as never)}
          onClose={() => setEditingKey(null)}
        />
      )}
    </div>
  );
}
