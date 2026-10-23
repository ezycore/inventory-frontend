"use client";
// coding-standard: maintained

import { ConversationList } from "@/components/inbox/conversation-list";
import { ThreadView } from "@/components/inbox/thread-view";
import { useHasPermission } from "@/hooks/use-has-permission";
import { useUrlParam } from "@/hooks/use-url-param";
import { useInboxConnection } from "@/services/api";
import { Button } from "@/ui/components/button";
import EmptyState from "@/ui/components/EmptyState";
import PageHeader from "@/ui/components/header";
import { cn } from "@/ui/lib/utils";
import { MessageCircle, Settings, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Inbox — the connected Facebook Page's Messenger chats (inventory-backend
 * `docs/features/inbox.md`). Phase 0: staff read and reply; no AI yet.
 *
 * The open chat lives in the URL (`?chat=<id>`), so a reload or Back keeps it. Wide screens
 * show the list and the thread side by side; a phone shows one at a time.
 *
 * Only `inbox.manage` may read the connection (it carries the setup tokens), so the
 * "connect your Page" prompt is shown to the people who can act on it; everyone else sees
 * the chats, or the list's own empty state.
 */
export default function InboxPage() {
  const t = useTranslations("inbox");
  const router = useRouter();
  const canManage = useHasPermission("inbox.manage");
  const { data: connection, isLoading } = useInboxConnection(canManage);
  const [chatId, setChatId] = useUrlParam("chat", "any", "");

  const settingsButton = canManage ? (
    <Button variant="outline" asChild>
      <Link href="/inbox/settings">
        <Settings className="h-4 w-4" />
        {t("page.settings")}
      </Link>
    </Button>
  ) : undefined;

  if (canManage && !isLoading && connection && !connection.connected) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("page.title")} subTitle={t("page.subtitle")} />
        <EmptyState
          icon={MessageCircle}
          title={t("notConnected.title")}
          description={t("notConnected.description")}
          action={{ label: t("notConnected.action"), onClick: () => router.push("/inbox/settings") }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("page.title")} subTitle={t("page.subtitle")} actions={settingsButton} />

      {connection?.status === "token_invalid" && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            <span className="font-medium">{t("attention.title")}</span>
            {connection.statusReason && <span className="block opacity-80">{connection.statusReason}</span>}
          </span>
          <Button size="sm" variant="outline" asChild>
            <Link href="/inbox/settings">{t("attention.fix")}</Link>
          </Button>
        </div>
      )}

      <div className="grid h-[calc(100dvh-14rem)] min-h-[420px] overflow-hidden rounded-lg border md:grid-cols-[320px_1fr]">
        <ConversationList
          selectedId={chatId || undefined}
          onSelect={setChatId}
          className={cn("md:border-r", chatId && "hidden md:flex")}
        />
        {chatId ? (
          // `key`: a half-typed reply must not follow the merchant into another chat.
          // The Back button is phone-only — the list is already beside the thread on wider screens.
          <ThreadView
            key={chatId}
            conversationId={chatId}
            onBack={() => setChatId("")}
            className="md:[&_header_button]:hidden"
          />
        ) : (
          <div className="hidden flex-col items-center justify-center gap-1 p-6 text-center md:flex">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">{t("thread.pick")}</p>
            <p className="text-sm text-muted-foreground">{t("thread.pickHint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
