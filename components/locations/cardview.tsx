"use client";
// coding-standard: maintained

import type { Location as LocationType } from "@/types";
import type { Translator } from "@/i18n/config";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import { Skeleton } from "@/ui/components/skeleton";
import { cn } from "@/ui/lib/utils";
import { formatDate } from "@/lib/format";
import type { AppLocale } from "@/i18n/config";
import {
  EllipsisVertical,
  MapPin,
  Pencil,
  Shield,
  Store,
  Trash2,
  Users,
  Warehouse,
} from "lucide-react";

// ── Design tokens per location type ────────────────────────────────────
const getTypeConfig = (
  t: Translator,
): Record<
  string,
  {
    icon: typeof Store;
    label: string;
    gradient: string;
    iconBg: string;
    iconColor: string;
    dot: string;
  }
> => ({
  store: {
    icon: Store,
    label: t("type.store"),
    gradient: "from-blue-500 to-cyan-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  warehouse: {
    icon: Warehouse,
    label: t("type.warehouse"),
    gradient: "from-amber-500 to-orange-400",
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
});

// ── Skeleton ────────────────────────────────────────────────────────────
export function LocationCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Top stripe */}
      <Skeleton className="h-1.5 w-full rounded-none" />

      <div className="flex flex-1 flex-col gap-5 p-5 pt-4">
        {/* Row 1 — icon · name */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>

        {/* Row 2 — info pills */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Row 3 — footer */}
        <div className="mt-auto flex items-center gap-2 pt-1 border-t border-border/40">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-28 ml-auto" />
        </div>
      </div>
    </div>
  );
}

// ── Card component ──────────────────────────────────────────────────────
const LocationCardView = (
  location: LocationType,
  { onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void },
  options: { t: Translator; locale: AppLocale },
) => {
  const { t, locale } = options;
  const {
    name,
    address,
    locationType,
    users = [],
    status,
    createdAt,
  } = location;

  const typeConfig = getTypeConfig(t);
  const config = typeConfig[locationType] || typeConfig.store;
  const TypeIcon = config.icon;
  const isActive = status === "active";
  const userCount = Array.isArray(users) ? users.length : 0;

  const createdDate = formatDate(createdAt, "dd MMM yyyy", locale);

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border",
        "bg-card text-card-foreground shadow-sm",
        "transition-all duration-300 ease-out",
        "hover:shadow-lg hover:-translate-y-0.5 hover:border-border",
        !isActive && "opacity-70",
      )}
    >
      {/* ── Top accent gradient stripe ─────────────────────────────── */}
      <div
        className={cn("h-1.5 w-full bg-gradient-to-r", config.gradient)}
      />

      {/* ── Card body ──────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-5 p-5 pt-4">
        {/* Row 1 — icon · name · actions */}
        <div className="flex items-start justify-between gap-3">
          {/* icon + meta */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                config.iconBg,
                "ring-1 ring-black/[0.04] dark:ring-white/[0.06]",
              )}
            >
              <TypeIcon className={cn("h-5 w-5", config.iconColor)} />
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <h3 className="truncate text-[15px] font-semibold leading-tight tracking-tight">
                  {name}
                </h3>
                {(location as any).default && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Shield className="h-3.5 w-3.5 shrink-0 fill-primary/20 text-primary" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {t("card.defaultTooltip")}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground/80 leading-none">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{address || t("card.noAddress")}</span>
              </div>
            </div>
          </div>

          {/* actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 shrink-0 rounded-lg",
                  "text-muted-foreground/60 hover:text-foreground",
                  "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                  "transition-opacity duration-200",
                )}
              >
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                {t("card.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {t("card.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Row 2 — info pills */}
        <div className="flex items-center gap-2.5">
          <Badge
            variant="outline"
            className="h-6 gap-1 rounded-full px-2.5 text-xs font-medium capitalize"
          >
            <TypeIcon className="h-3 w-3" />
            {config.label}
          </Badge>

          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className="h-6 gap-1 rounded-full px-2.5 text-xs font-medium cursor-default"
              >
                <Users className="h-3 w-3" />
                {t("card.usersCount", { count: userCount })}
              </Badge>
            </TooltipTrigger>
            {userCount > 0 && (
              <TooltipContent side="bottom" className="max-w-xs">
                <ul className="space-y-0.5 text-xs">
                  {(users as any[]).slice(0, 5).map((u) => (
                    <li key={u._id}>
                      {u.name}
                    </li>
                  ))}
                  {userCount > 5 && (
                    <li className="text-muted-foreground">
                      {t("card.moreCount", { count: userCount - 5 })}
                    </li>
                  )}
                </ul>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Row 3 — footer metadata */}
        <div className="mt-auto flex items-center gap-2 pt-1 border-t border-border/40">
          {/* status dot */}
          <span className="relative flex h-2 w-2">
            {isActive && (
              <span
                className={cn(
                  "absolute inline-flex h-full w-full animate-ping rounded-full opacity-50",
                  config.dot,
                )}
              />
            )}
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                isActive ? config.dot : "bg-muted-foreground/40",
              )}
            />
          </span>
          <span className="text-xs text-muted-foreground">
            {isActive ? t("card.active") : t("card.inactive")}
          </span>

          {(location as any).default && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <Badge
                variant="secondary"
                className="h-5 rounded-md px-1.5 text-[10px] font-semibold uppercase tracking-wider"
              >
                {t("card.default")}
              </Badge>
            </>
          )}

          <span className="ml-auto text-[11px] text-muted-foreground/50">
            {t("card.createdOn", { date: createdDate })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LocationCardView;
