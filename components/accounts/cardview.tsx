"use client";

import type { Account } from "@/types";
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
import { cn } from "@/ui/lib/utils";
import {
  Building2,
  CreditCard,
  EllipsisVertical,
  Pencil,
  PlusCircle,
  Receipt,
  Smartphone,
  Star,
  Trash2,
  Wallet,
} from "lucide-react";
import { useCurrency } from "@/lib/currency";
import { Skeleton } from "@/ui/components/skeleton";

// ── Skeleton loader matching the card layout ────────────────────────────
export function AccountCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Top accent stripe */}
      <Skeleton className="h-1.5 w-full rounded-none" />

      <div className="flex flex-1 flex-col gap-5 p-5 pt-4">
        {/* Row 1 — icon · name */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>

        {/* Row 2 — Balance */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-36" />
        </div>

        {/* Row 3 — Footer */}
        <div className="mt-auto flex items-center gap-2 pt-1 border-t border-border/40">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-5 w-14 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// ── Design tokens per account type ──────────────────────────────────────
const typeConfig: Record<
  string,
  {
    icon: typeof Wallet;
    label: string;
    /** gradient applied to the top accent stripe */
    gradient: string;
    /** icon container background */
    iconBg: string;
    /** icon colour */
    iconColor: string;
    /** small dot colour for status row */
    dot: string;
  }
> = {
  cash: {
    icon: Wallet,
    label: "Cash",
    gradient: "from-emerald-500 to-teal-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  bank: {
    icon: Building2,
    label: "Bank",
    gradient: "from-blue-500 to-indigo-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  mfs: {
    icon: Smartphone,
    label: "Mobile Banking",
    gradient: "from-violet-500 to-purple-400",
    iconBg: "bg-violet-50 dark:bg-violet-950/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
  },
  custom: {
    icon: CreditCard,
    label: "Custom",
    gradient: "from-amber-500 to-orange-400",
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
};

// ── Props ───────────────────────────────────────────────────────────────
interface AccountCardViewProps {
  item: Account;
  actions: {
    onEdit: (item: Account) => void;
    onDelete: (item: Account) => void;
    onAddInvestment?: (item: Account) => void;
    onViewTransactions?: (item: Account) => void;
  };
}

// ── Component ───────────────────────────────────────────────────────────
export default function AccountCardView({
  item,
  actions,
}: AccountCardViewProps) {
  const { format } = useCurrency();
  const config = typeConfig[item.type] || typeConfig.cash;
  const TypeIcon = config.icon;
  const isPositive = item.balance >= 0;
  const isActive = item.isActive !== false && (item as any).status !== "inactive";

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
        className={cn(
          "h-1.5 w-full bg-gradient-to-r",
          config.gradient,
        )}
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
                  {item.name}
                </h3>
                {item.isDefault && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                    </TooltipTrigger>
                    <TooltipContent side="top">Default account</TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-xs text-muted-foreground/80 leading-none">
                {config.label}
                {item.accountNumber && (
                  <span className="ml-1.5 font-mono tracking-wider">
                    · {item.accountNumber}
                  </span>
                )}
              </p>
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
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => actions.onEdit(item)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              {actions.onAddInvestment && (
                <DropdownMenuItem onClick={() => actions.onAddInvestment!(item)}>
                  <PlusCircle className="mr-2 h-3.5 w-3.5" />
                  Add Investment
                </DropdownMenuItem>
              )}
              {actions.onViewTransactions && (
                <DropdownMenuItem
                  onClick={() => actions.onViewTransactions!(item)}
                >
                  <Receipt className="mr-2 h-3.5 w-3.5" />
                  View Transactions
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => actions.onDelete(item)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Row 2 — Balance (the hero number) */}
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
            Current Balance
          </p>
          <p
            className={cn(
              "text-2xl font-bold tracking-tight tabular-nums",
              isPositive
                ? "text-foreground"
                : "text-destructive",
            )}
          >
            {format(item.balance)}
          </p>
        </div>

        {/* Row 3 — Footer metadata */}
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
            {isActive ? "Active" : "Inactive"}
          </span>

          {item.isDefault && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <Badge
                variant="secondary"
                className="h-5 rounded-md px-1.5 text-[10px] font-semibold uppercase tracking-wider"
              >
                Default
              </Badge>
            </>
          )}

          {item.description && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="max-w-[120px] truncate text-xs text-muted-foreground/70 cursor-default">
                    {item.description}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {item.description}
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
