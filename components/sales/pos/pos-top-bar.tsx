"use client";
// coding-standard: maintained
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { formatRoleName } from "@/components/users/helpers";
import { useAuthStore } from "@/services/stores";
import { Avatar, AvatarFallback } from "@/ui/components/avatar";
import { Button } from "@/ui/components/button";

/**
 * The counter's only chrome: who is selling (far left), language, and the way
 * back to the dashboard. No shop name or branch switcher: the till sells from
 * the location it was opened on, and switching it is not the cashier's call.
 */
export function PosTopBar() {
  const t = useTranslations("sales.pos");
  const user = useAuthStore((s) => s.user);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "";
  const initials =
    `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase() ||
    name.slice(0, 1).toUpperCase();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-semibold">{name}</div>
          {user?.role ? (
            <div className="truncate text-xs text-muted-foreground">{formatRoleName(user.role)}</div>
          ) : null}
        </div>
      </div>
      <div className="flex-1" />
      <LanguageToggle />
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard" aria-label={t("exit")}>
          <LayoutDashboard className="size-4" />
          <span className="hidden sm:inline">{t("exit")}</span>
        </Link>
      </Button>
    </header>
  );
}
