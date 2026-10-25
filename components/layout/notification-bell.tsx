"use client";
// coding-standard: maintained

import { useAlertChime } from "@/hooks/use-alert-chime";
import { useFormatters } from "@/hooks/use-formatters";
import {
  useMarkAlertRead,
  useMarkAllAlertsRead,
  useNotificationBell,
  type MerchantAlert,
} from "@/services/api";
import { Button } from "@ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@ui/components/popover";
import { Switch } from "@ui/components/switch";
import { cn } from "@ui/lib/utils";
import { Bell, MessageCircle, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { alertHref, useAlertText } from "./use-alert-text";

/**
 * The top-bar bell (backend `docs/plan/notification-bell.md`): new online orders and chats the AI
 * handed to staff, for whoever may act on them. Polls every 30 s; a new alert plays a chime and,
 * when switched on, a browser pop-up (`useAlertChime`). Opening an alert marks it read for this
 * user only. Which alerts ring at all is the shop's choice, in Settings → Notifications.
 */
export function NotificationBell() {
  const t = useTranslations("layout.bell");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data } = useNotificationBell();
  const markRead = useMarkAlertRead();
  const markAllRead = useMarkAllAlertsRead();
  const describe = useAlertText();

  const openAlert = useCallback(
    (alert: MerchantAlert) => {
      if (!alert.read) markRead.mutate(alert._id);
      setOpen(false);
      router.push(alertHref(alert));
    },
    [markRead, router],
  );
  const chime = useAlertChime(data?.items, describe, openAlert);

  const unread = data?.unread ?? 0;
  const items = data?.items ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? t("labelUnread", { count: unread }) : t("label")}
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-destructive px-1 text-center text-[10px] font-semibold leading-4 text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">{t("title")}</p>
          {unread > 0 && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => markAllRead.mutate(undefined)}>
              {t("markAllRead")}
            </Button>
          )}
        </div>

        {items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {items.map((alert) => (
              <AlertRow key={alert._id} alert={alert} text={describe(alert)} onOpen={() => openAlert(alert)} />
            ))}
          </ul>
        )}

        <div className="space-y-2 border-t px-3 py-2.5 text-xs">
          <label className="flex items-center justify-between gap-2">
            <span>{t("sound")}</span>
            <Switch checked={chime.prefs.sound} onCheckedChange={chime.setSound} />
          </label>
          {chime.prefs.sound && chime.soundBlocked && <p className="text-muted-foreground">{t("soundBlocked")}</p>}
          {chime.permission !== "unsupported" && (
            <label className="flex items-center justify-between gap-2">
              <span>{t("popup")}</span>
              <Switch
                checked={chime.prefs.popup && chime.permission === "granted"}
                disabled={chime.permission === "denied"}
                onCheckedChange={(on) => void chime.setPopup(on)}
              />
            </label>
          )}
          {chime.permission === "denied" && <p className="text-muted-foreground">{t("popupBlocked")}</p>}
          <p className="text-muted-foreground">{t("thisBrowser")}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AlertRow({
  alert,
  text,
  onOpen,
}: {
  alert: MerchantAlert;
  text: { title: string; body: string };
  onOpen: () => void;
}) {
  const ago = useTimeAgo();
  const Icon = alert.link.kind === "order" ? ShoppingBag : MessageCircle;
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={cn("flex w-full gap-3 px-3 py-2.5 text-left hover:bg-muted/60", !alert.read && "bg-primary/5")}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-sm", !alert.read && "font-semibold")}>{text.title}</span>
          {text.body && <span className="block truncate text-xs text-muted-foreground">{text.body}</span>}
          <span className="block text-[11px] text-muted-foreground">{ago(alert.createdAt)}</span>
        </span>
        {!alert.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
      </button>
    </li>
  );
}

/** "just now", "5 min ago", "3 hr ago" — then the date and time, on the shop's clock. */
function useTimeAgo() {
  const t = useTranslations("layout.bell");
  const { formatDateTime } = useFormatters();
  return (at: string) => {
    const minutes = Math.floor((Date.now() - new Date(at).getTime()) / 60_000);
    if (minutes < 1) return t("justNow");
    if (minutes < 60) return t("minutesAgo", { count: minutes });
    if (minutes < 24 * 60) return t("hoursAgo", { count: Math.floor(minutes / 60) });
    return formatDateTime(at);
  };
}
