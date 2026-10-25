"use client";
// coding-standard: maintained

import { useFormatters } from "@/hooks/use-formatters";
import { useReplyInbox } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Textarea } from "@/ui/components/textarea";
import { SendHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/** Messenger rejects a text over 2000 characters (backend `MESSENGER_TEXT_LIMIT`). */
const MAX_LENGTH = 2000;

interface ReplyBoxProps {
  conversationId: string;
  canReply: boolean;
  /** `false`: the chat came through a Page the shop no longer has connected — read-only. */
  pageConnected: boolean;
  /** The server's `replyWindowClosesAt` — when Facebook stops accepting a reply. */
  windowClosesAt?: string | null;
}

/**
 * The reply box. Facebook allows a normal reply only within 24 hours of the customer's last
 * message, and the extension past it needs App Review — so outside the window the box is
 * replaced by the reason rather than left to fail (backend `docs/features/inbox.md` §4).
 * Enter sends, Shift+Enter is a new line.
 */
export function ReplyBox({ conversationId, canReply, pageConnected, windowClosesAt }: ReplyBoxProps) {
  const t = useTranslations("inbox");
  const { formatDateTime } = useFormatters();
  const [text, setText] = useState("");
  const reply = useReplyInbox(conversationId);

  if (!canReply) {
    return (
      <p className="border-t bg-muted/40 p-3 text-sm text-muted-foreground">
        {t(pageConnected ? "thread.windowClosed" : "thread.pageDisconnected")}
      </p>
    );
  }

  const send = () => {
    const body = text.trim();
    if (!body || reply.isPending) return;
    reply.mutate(body, { onSuccess: () => setText("") });
  };

  return (
    <div className="space-y-1.5 border-t p-3">
      <div className="flex items-end gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={t("reply.placeholder")}
          aria-label={t("reply.placeholder")}
          rows={2}
          className="max-h-40 min-h-11 resize-none"
        />
        <Button onClick={send} disabled={!text.trim() || reply.isPending} aria-label={t("reply.send")}>
          <SendHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">{reply.isPending ? t("reply.sending") : t("reply.send")}</span>
        </Button>
      </div>
      {windowClosesAt && (
        <p className="text-xs text-muted-foreground">
          {t("thread.windowOpen", { time: formatDateTime(windowClosesAt) })}
        </p>
      )}
    </div>
  );
}
