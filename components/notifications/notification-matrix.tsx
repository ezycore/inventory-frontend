"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Lock, Mail, MessageSquare } from "lucide-react";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/services/api";
import type { NotificationEventRow } from "@/types/api";
import { Badge } from "@/ui/components/badge";
import { Checkbox } from "@/ui/components/checkbox";
import { SimpleTable, type SimpleColumn } from "@/ui/components/simple-table";
import { Skeleton } from "@/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/ui/components/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/components/tooltip";

type Audience = "customer" | "merchant";
type Channel = "email" | "sms";

const AUDIENCES: Audience[] = ["customer", "merchant"];
const CHANNELS: Channel[] = ["email", "sms"];

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

  // SMS has no provider until Phase 3 of the notification plan; the column
  // renders but every box is locked until the org's SMS master switch is on.
  const smsAvailable = data?.sms.enabled === true;

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
          ...(row.templates ? { templates: row.templates } : {}),
          ...(row.schedule ? { schedule: row.schedule } : {}),
        },
      },
    });
  };

  const channelCell = (
    row: NotificationEventRow,
    audience: Audience,
    channel: Channel,
  ) => {
    const toggles = row.channels[audience];
    // The event doesn't address this audience at all — not an "off" state.
    if (!toggles) return <span className="text-muted-foreground/40">—</span>;

    const checked = toggles[channel];
    const smsLocked = channel === "sms" && !smsAvailable;
    const locked = row.mandatory || smsLocked;

    const box = (
      <Checkbox
        checked={checked}
        disabled={locked || updateSettings.isPending}
        aria-label={`${row.key} ${audience} ${channel}`}
        onCheckedChange={() => toggle(row, audience, channel)}
      />
    );
    if (!locked) return box;

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1">
            {box}
            <Lock className="size-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {row.mandatory ? t("mandatoryHint") : t("smsLockedHint")}
        </TooltipContent>
      </Tooltip>
    );
  };

  const columns: SimpleColumn<NotificationEventRow>[] = [
    {
      key: "event",
      header: t("columns.event"),
      cell: (row) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{t(`events.${row.key}` as never)}</span>
            {row.mandatory && (
              <Badge variant="secondary" className="text-[10px]">
                {t("alwaysOn")}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">{row.key}</div>
        </div>
      ),
    },
    ...AUDIENCES.flatMap((audience) =>
      CHANNELS.map(
        (channel): SimpleColumn<NotificationEventRow> => ({
          key: `${audience}-${channel}`,
          align: "center",
          headClassName: "w-24",
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
          cell: (row) => channelCell(row, audience, channel),
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
          <TabsList>
            <TabsTrigger value="all">{t("domains.all")}</TabsTrigger>
            {availableDomains.map((domain) => (
              <TabsTrigger key={domain} value={domain}>
                {t(`domains.${domain}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <div className="overflow-x-auto">
        <SimpleTable
          columns={columns}
          rows={visible}
          getRowKey={(row) => row.key}
        />
      </div>
    </div>
  );
}
