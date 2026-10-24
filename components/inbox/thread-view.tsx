"use client";
// coding-standard: maintained

import { useHasPermission } from "@/hooks/use-has-permission";
import { useInboxThread } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Skeleton } from "@/ui/components/skeleton";
import { cn } from "@/ui/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { initialsOf } from "./inbox-utils";
import { MessageBubble } from "./message-bubble";
import { OwnershipBanner } from "./ownership-banner";
import { ReplyBox } from "./reply-box";

interface ThreadViewProps {
  conversationId: string;
  /** Phone layout only: back to the list. */
  onBack?: () => void;
  className?: string;
}

/**
 * The right pane: one chat, polled every 5 s (`useInboxThread`). Opening it marks it read on
 * the server. Holders of `inbox.view` without `inbox.reply` read it with no reply box.
 */
export function ThreadView({ conversationId, onBack, className }: ThreadViewProps) {
  const t = useTranslations("inbox");
  const canReply = useHasPermission("inbox.reply");
  const { data, isLoading } = useInboxThread(conversationId);
  const bottom = useRef<HTMLDivElement>(null);
  const lastMessageId = data?.messages.at(-1)?._id;

  // Follow the newest message — on open, and whenever a poll or a reply adds one.
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [lastMessageId]);

  if (isLoading || !data) {
    return (
      <div className={cn("space-y-3 p-4", className)}>
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="ml-auto h-16 w-2/3" />
      </div>
    );
  }

  const { conversation, messages, hasOlder } = data;
  const name = conversation.customerName || t("list.customer");

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <header className="flex items-center gap-3 border-b px-3 py-2.5">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label={t("thread.back")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initialsOf(conversation.customerName)}
        </span>
        <span className="truncate font-medium">{name}</span>
      </header>
      <OwnershipBanner conversation={conversation} />

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {hasOlder && <p className="text-center text-xs text-muted-foreground">{t("thread.latestOnly")}</p>}
        {messages.map((message) => (
          <MessageBubble key={message._id ?? message.externalId} message={message} />
        ))}
        <div ref={bottom} />
      </div>

      {canReply && (
        <ReplyBox
          conversationId={conversation._id}
          canReply={conversation.canReply}
          windowClosesAt={conversation.replyWindowClosesAt}
        />
      )}
    </div>
  );
}
