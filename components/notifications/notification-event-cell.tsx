"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Clock, PencilLine, SlidersHorizontal } from "lucide-react";
import type { NotificationEventRow } from "@/types/api";
import { SmsPreviewNote } from "@/components/notifications/sms-preview-note";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { SimpleSelect } from "@/ui/components/simple-select";

type Audience = "customer" | "merchant";

const AUDIENCES: Audience[] = ["customer", "merchant"];

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

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  value: String(hour),
  label: `${String(hour).padStart(2, "0")}:00`,
}));

/**
 * The first column of the notification matrix: what the event is, where its
 * switch lives when it is not here, what its SMS says, its digest hour, and —
 * for events the server marks `smsEditable` — the way into the SMS editor.
 */
export function NotificationEventCell({
  row,
  canEditSms,
  onEditSms,
  onSetHour,
}: {
  row: NotificationEventRow;
  /** SMS is on the plan — the editor is offered only then (module-toggle rule). */
  canEditSms: boolean;
  onEditSms: () => void;
  onSetHour: (hour: number) => void;
}) {
  const t = useTranslations("settings.notifications");
  const editable = canEditSms && row.smsEditable.includes("customer");
  const customWording = row.smsPreview?.customer?.source === "custom";

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{t(`events.${row.key}` as never)}</span>
        {row.mandatory && (
          <Badge variant="secondary" className="text-[10px]">
            {t("alwaysOn")}
          </Badge>
        )}
        {customWording && (
          <Badge variant="outline" className="text-[10px]">
            {t("smsEditor.customBadge")}
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
      {editable && (
        <Button
          type="button"
          variant="link"
          size="xs"
          className="mt-1 h-7 px-0"
          onClick={onEditSms}
        >
          <PencilLine />
          {t("smsEditor.editButton")}
        </Button>
      )}
      {row.schedule && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <Clock className="size-3 text-muted-foreground" />
          <SimpleSelect
            size="sm"
            className="h-7 w-24"
            value={String(row.schedule.hour)}
            onValueChange={(value) => onSetHour(Number(value))}
            options={HOUR_OPTIONS}
          />
          <span className="text-xs text-muted-foreground">
            {t("scheduleHint")}
          </span>
        </div>
      )}
    </div>
  );
}
