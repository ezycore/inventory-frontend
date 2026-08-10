"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Clock,
  Lock,
  Mail,
  MessageSquare,
  SlidersHorizontal,
} from "lucide-react";
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from "@/services/api";
import type { NotificationEventRow } from "@/types/api";
import { SmsPreviewNote } from "@/components/notifications/sms-preview-note";
import { Badge } from "@/ui/components/badge";
import { Checkbox } from "@/ui/components/checkbox";
import { SimpleSelect } from "@/ui/components/simple-select";
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

/**
 * Where an event's own switch lives, for the rows the backend marks `managedBy`.
 *
 * The registry sends a slug, not a URL — it is this side that knows its own
 * routes. Two switches for one feature is a dead end, not a redundancy: a
 * merchant who un-ticked the box here and later enabled the feature on its own
 * page would get silence, with the send counted as done and nothing to read.
 * So the box becomes a link to whoever actually owns the decision.
 */
const MANAGED_BY_ROUTE: Record<string, string> = {
  "storefront.cartRecovery": "/ecommerce/settings?tab=checkout",
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
    // A managed row reports what its feature currently does; the switch is
    // elsewhere. The config API rejects an override for these keys outright, so
    // an enabled box here would only ever produce a 400.
    const locked = row.mandatory || smsLocked || !!row.managedBy;

    const box = (
      <Checkbox
        checked={checked}
        disabled={locked || updateSettings.isPending}
        aria-label={`${row.key} ${audience} ${channel}`}
        onCheckedChange={() => toggle(row, audience, channel)}
      />
    );

    // A reserved same-size slot for the lock icon (present or not) keeps the
    // checkbox itself at a fixed x-position — otherwise centering content of
    // different widths (box alone vs. box+lock) shifts the box as state changes.
    const content = (
      <span className="inline-flex items-center gap-1">
        {box}
        {locked ? (
          <Lock className="size-3 text-muted-foreground" />
        ) : (
          <span className="size-3" aria-hidden="true" />
        )}
      </span>
    );

    if (locked) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent>
            {row.mandatory
              ? t("mandatoryHint")
              : row.managedBy && !smsLocked
                ? t("managedHint")
                : t("smsLockedHint")}
          </TooltipContent>
        </Tooltip>
      );
    }

    // An UNticked SMS box is exactly where the text matters: the merchant is
    // deciding whether to start paying for this event, and the inline preview
    // below only appears once it is already on. A tooltip answers "what would
    // this say?" before the money is committed.
    const preview = channel === "sms" ? row.smsPreview?.[audience] : undefined;
    if (!preview || checked) return content;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <SmsPreviewNote preview={preview} audience={audience} />
        </TooltipContent>
      </Tooltip>
    );
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
          ...(row.templates ? { templates: row.templates } : {}),
          schedule: { hour },
        },
      },
    });
  };

  const hourOptions = Array.from({ length: 24 }, (_, hour) => ({
    value: String(hour),
    label: `${String(hour).padStart(2, "0")}:00`,
  }));

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
          {/* The row is read-only, so it has to say where the switch IS —
              a locked box with no destination is the dead end, restated. */}
          {row.managedBy && MANAGED_BY_ROUTE[row.managedBy] ? (
            <Link
              href={MANAGED_BY_ROUTE[row.managedBy]}
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
            >
              <SlidersHorizontal className="size-3" />
              {t("managedElsewhere")}
            </Link>
          ) : null}
          {/* Only for audiences whose SMS is actually ON — this is the running
              cost of the current configuration, not a catalogue. The text for
              an event that is off lives in the checkbox tooltip instead. */}
          {AUDIENCES.filter(
            (audience) => row.channels[audience]?.sms && row.smsPreview?.[audience],
          ).map((audience) => (
            <SmsPreviewNote
              key={audience}
              className="mt-1.5 rounded-md border-l-2 border-muted pl-2"
              preview={row.smsPreview?.[audience]}
              audience={audience}
            />
          ))}
          {row.schedule && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <Clock className="size-3 text-muted-foreground" />
              <SimpleSelect
                size="sm"
                className="h-7 w-24"
                value={String(row.schedule.hour)}
                onValueChange={(value) => setHour(row, Number(value))}
                options={hourOptions}
              />
              <span className="text-xs text-muted-foreground">
                {t("scheduleHint")}
              </span>
            </div>
          )}
        </div>
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
          {/* One nowrap trigger per domain overruns a phone viewport, and nothing clips
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
    </div>
  );
}
