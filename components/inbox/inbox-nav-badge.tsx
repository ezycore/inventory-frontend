"use client";
// coding-standard: maintained

import { useInboxSummary } from "@/services/api";
import { SidebarMenuBadge } from "@/ui/components/sidebar";

/**
 * Unread chats on the sidebar's Inbox row (polled every 30 s). Mounted only beside that row,
 * which `filterNavItems` already drops for anyone without `inbox.view` or the `inbox`
 * feature — so it never asks the API on behalf of someone who would get a 403.
 */
export function InboxNavBadge() {
  const { data } = useInboxSummary();
  const count = data?.unreadConversations ?? 0;
  if (count === 0) return null;
  return (
    <SidebarMenuBadge className="bg-primary text-primary-foreground">
      {count > 99 ? "99+" : count}
    </SidebarMenuBadge>
  );
}
