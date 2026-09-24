"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import type { NotificationEventRow } from "@/types/api";
import { SmsPreviewNote } from "@/components/notifications/sms-preview-note";
import { Checkbox } from "@/ui/components/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/components/tooltip";

type Audience = "customer" | "merchant";
type Channel = "email" | "sms";

/**
 * One Email/SMS box of the notification matrix, for one audience — or a dash
 * when the event does not address that audience at all (not an "off" state).
 */
export function NotificationChannelCell({
  row,
  audience,
  channel,
  smsAvailable,
  pending,
  onToggle,
}: {
  row: NotificationEventRow;
  audience: Audience;
  channel: Channel;
  /** Plan grants SMS AND the master switch is on. */
  smsAvailable: boolean;
  pending: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations("settings.notifications");
  const toggles = row.channels[audience];
  if (!toggles) return <span className="text-muted-foreground/40">—</span>;

  const checked = toggles[channel];
  const smsLocked = channel === "sms" && !smsAvailable;
  // A managed row reports what its feature currently does; the switch is
  // elsewhere. The config API rejects an override for these keys outright, so
  // an enabled box here would only ever produce a 400.
  const locked = row.mandatory || smsLocked || !!row.managedBy;

  // A reserved same-size slot for the lock icon (present or not) keeps the
  // checkbox itself at a fixed x-position — otherwise centering content of
  // different widths (box alone vs. box+lock) shifts the box as state changes.
  const content = (
    <span className="inline-flex items-center gap-1">
      <Checkbox
        checked={checked}
        disabled={locked || pending}
        aria-label={`${row.key} ${audience} ${channel}`}
        onCheckedChange={onToggle}
      />
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
}
