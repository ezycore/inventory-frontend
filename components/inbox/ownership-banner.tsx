"use client";
// coding-standard: maintained

import { useHasPermission } from "@/hooks/use-has-permission";
import { useInboxSummary, useSetInboxOwner, type InboxConversation } from "@/services/api";
import { Button } from "@/ui/components/button";
import { cn } from "@/ui/lib/utils";
import { Bot, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Who is answering this chat, and the switch between them (backend plan D4): **Take over** stops
 * the AI so staff can answer; **Give back to AI** returns it — offered only while the AI is on for
 * this Page (`summary.aiActive`), because a chat given back to an AI that is off answers nobody.
 *
 * Renders nothing for a shop that never used the AI: no AI, no handover, nothing to explain.
 */
export function OwnershipBanner({ conversation }: { conversation: InboxConversation }) {
  const t = useTranslations("inbox.thread.owner");
  const canReply = useHasPermission("inbox.reply");
  const { data: summary } = useInboxSummary();
  const setOwner = useSetInboxOwner(conversation._id);
  const aiOwns = conversation.owner === "ai";
  const aiActive = Boolean(summary?.aiActive);
  // Inside the merchant's AI-off hours the chat is still the AI's, but the team answers now.
  const aiOff = aiOwns && Boolean(summary?.aiOffNow);

  if (!aiOwns && !aiActive) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 text-sm",
        aiOwns ? "bg-primary/5" : "bg-amber-50 dark:bg-amber-950/30",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {aiOwns ? <Bot className="h-4 w-4 shrink-0 text-primary" /> : <UserRound className="h-4 w-4 shrink-0" />}
        <span className="truncate">
          {aiOff ? t("aiOff") : aiOwns ? t("ai") : t("staff", { reason: conversation.handoverReason ?? t("staffDefault") })}
        </span>
      </span>
      {canReply && (aiOwns || aiActive) && (
        <Button
          size="sm"
          variant="outline"
          disabled={setOwner.isPending}
          onClick={() => setOwner.mutate(aiOwns ? "staff" : "ai")}
        >
          {aiOwns ? t("takeOver") : t("giveBack")}
        </Button>
      )}
    </div>
  );
}
