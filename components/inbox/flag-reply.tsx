"use client";
// coding-standard: maintained

import { INBOX_AI_FLAG_REASONS, type InboxAiFlagReason, type InboxMessage, useFlagInboxReply, useUnflagInboxReply } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Label } from "@/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/components/popover";
import { RadioGroup, RadioGroupItem } from "@/ui/components/radio-group";
import { Textarea } from "@/ui/components/textarea";
import { cn } from "@/ui/lib/utils";
import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

/**
 * "Flag this reply" (backend plan §12 Phase 3) under an AI reply: a reason and a note, so the shop
 * owner can review what went wrong and we can turn it into a test case for the model. A flagged
 * reply says so, with the reason, and the flag can be changed or taken off.
 */
export function FlagReply({ conversationId, message }: { conversationId: string; message: InboxMessage }) {
  const t = useTranslations("inbox.thread.flag");
  const id = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<InboxAiFlagReason>(message.aiFlag?.reason ?? "wrong_info");
  const [note, setNote] = useState(message.aiFlag?.note ?? "");
  const flag = useFlagInboxReply(conversationId);
  const unflag = useUnflagInboxReply(conversationId);
  const messageId = message._id ?? "";
  const flagged = message.aiFlag;
  const needsNote = reason === "other" && !note.trim();

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // Re-open on what is saved, not on an abandoned edit.
        if (next) {
          setReason(flagged?.reason ?? "wrong_info");
          setNote(flagged?.note ?? "");
        }
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded px-1 text-[11px] hover:underline",
            flagged ? "font-medium text-amber-200" : "text-primary-foreground/75",
          )}
        >
          <Flag className="h-3 w-3" />
          {flagged ? t("flagged", { reason: t(`reason.${flagged.reason}`) }) : t("action")}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        <p className="text-sm font-medium">{t("title")}</p>
        <RadioGroup value={reason} onValueChange={(v) => setReason(v as InboxAiFlagReason)} className="gap-2">
          {INBOX_AI_FLAG_REASONS.map((r) => (
            <div key={r} className="flex items-center gap-2">
              <RadioGroupItem value={r} id={`${id}-${r}`} />
              <Label htmlFor={`${id}-${r}`} className="font-normal">
                {t(`reason.${r}`)}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t("notePlaceholder")}
          aria-label={t("note")}
        />
        <div className="flex justify-between gap-2">
          {flagged ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={unflag.isPending}
              onClick={() => unflag.mutate(messageId, { onSuccess: () => setOpen(false) })}
            >
              {t("remove")}
            </Button>
          ) : (
            <span />
          )}
          <Button
            size="sm"
            disabled={needsNote || flag.isPending}
            onClick={() =>
              flag.mutate(
                { messageId, reason, ...(note.trim() && { note: note.trim() }) },
                { onSuccess: () => setOpen(false) },
              )
            }
          >
            {t("save")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
