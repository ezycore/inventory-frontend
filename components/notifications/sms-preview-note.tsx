"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { MessageSquare } from "lucide-react";
import type { NotificationEventRow } from "@/types/api";
import { Badge } from "@/ui/components/badge";

type Audience = "customer" | "merchant";

/**
 * What an SMS on this event actually says, and what it costs.
 *
 * SMS is the only channel billed per message, so the matrix cannot ask a
 * merchant to tick a box while hiding both the words and the price. The text
 * comes from the server already rendered with sample values and the org's real
 * SMS store name — and the merchant's own wording when they wrote some
 * (`sms-preview.ts`) — so the segment count beside it is the count they will be
 * charged, not an estimate this component re-derives.
 *
 * The segment badge is only drawn when it is bad news. A "1 segment" badge on
 * every row is decoration; a "2 segments" badge is the one thing on this screen
 * that doubles a bill, and it earns the colour.
 */
export function SmsPreviewNote({
  preview,
  audience,
  className,
}: {
  preview: NonNullable<NotificationEventRow["smsPreview"]>[Audience];
  audience: Audience;
  className?: string;
}) {
  const t = useTranslations("settings.notifications");
  if (!preview) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-1.5">
        <MessageSquare className="size-3 shrink-0 text-muted-foreground" />
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {t(`audiences.${audience}`)}
        </span>
        {preview.segments > 1 && (
          <Badge variant="destructive" className="text-[10px]">
            {t("sms.previewSegments", { count: preview.segments })}
          </Badge>
        )}
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{preview.text}</p>
    </div>
  );
}
