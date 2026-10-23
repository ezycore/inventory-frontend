"use client";
// coding-standard: maintained

import { useFormatters } from "@/hooks/use-formatters";
import { useInboxConversations, type InboxConversation } from "@/services/api";
import { Input } from "@/ui/components/input";
import { Switch } from "@/ui/components/switch";
import { cn } from "@/ui/lib/utils";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { initialsOf } from "./inbox-utils";

interface ConversationListProps {
  selectedId?: string;
  onSelect: (id: string) => void;
  className?: string;
}

/**
 * The left pane: every Messenger chat, newest first, polled every 10 s
 * (`useInboxConversations`). Names come from Facebook a moment after the first
 * message, so a row can briefly read "Customer".
 */
export function ConversationList({ selectedId, onSelect, className }: ConversationListProps) {
  const t = useTranslations("inbox.list");
  const { formatDateTime } = useFormatters();
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, isLoading } = useInboxConversations({
    search: search.trim() || undefined,
    unread: unreadOnly ? "true" : undefined,
    limit: 50,
  });
  const rows = data?.items ?? [];
  const filtering = Boolean(search.trim()) || unreadOnly;

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="space-y-2 border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="pl-8"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={unreadOnly} onCheckedChange={setUnreadOnly} />
          {t("unreadOnly")}
        </label>
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto">
        {!isLoading && rows.length === 0 && (
          <li className="p-6 text-center text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{filtering ? t("noMatch") : t("empty")}</p>
            {!filtering && <p className="mt-1">{t("emptyHint")}</p>}
          </li>
        )}
        {rows.map((row) => (
          <ConversationRow
            key={row._id}
            row={row}
            active={row._id === selectedId}
            when={formatDateTime(row.lastMessageAt)}
            fallbackName={t("customer")}
            youPrefix={t("you")}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
}

interface ConversationRowProps {
  row: InboxConversation;
  active: boolean;
  when: string;
  fallbackName: string;
  youPrefix: string;
  onSelect: (id: string) => void;
}

function ConversationRow({ row, active, when, fallbackName, youPrefix, onSelect }: ConversationRowProps) {
  const name = row.customerName || fallbackName;
  const unread = row.unreadCount > 0;
  const preview = `${row.lastMessageRole === "staff" ? youPrefix : ""}${row.lastMessagePreview ?? ""}`;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(row._id)}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex w-full items-start gap-3 border-b px-3 py-3 text-left transition-colors hover:bg-muted/60",
          active && "bg-muted",
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {initialsOf(row.customerName)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate text-sm", unread ? "font-semibold" : "font-medium")}>{name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{when}</span>
          </span>
          <span className="mt-0.5 flex items-center gap-2">
            <span className={cn("truncate text-xs", unread ? "text-foreground" : "text-muted-foreground")}>
              {preview}
            </span>
            {unread && (
              <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-5 text-primary-foreground">
                {row.unreadCount}
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}
