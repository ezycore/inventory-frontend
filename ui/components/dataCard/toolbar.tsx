"use client";

import { Search, X, Trash2, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { Input } from "@/ui/components/input";
import { Button } from "@/ui/components/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/components/alert-dialog";
import { GlobalFilter } from "@/ui/components/filters/global-filter";
import { DataCardSearchConfig, FilterConfig, CardCustomAction, CardLayout } from "@/types/DataCard";
import { cn } from "@/ui/lib/utils";

interface DataCardToolbarProps {
  filterConfig?: FilterConfig;
  searchConfig?: DataCardSearchConfig;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  selectable?: boolean;
  hasSelection?: boolean;
  selectedRowsCount?: number;
  deletable?: boolean;
  onBulkDelete?: () => void;
  isDeleting?: boolean;
  actionButton?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  customActions?: CardCustomAction[];
  // Layout switching
  layout?: CardLayout;
  onLayoutChange?: (layout: CardLayout) => void;
  showLayoutSwitcher?: boolean;
}

export function DataCardToolbar({
  searchConfig,
  filterConfig,
  globalFilter,
  onGlobalFilterChange,
  selectable,
  hasSelection,
  selectedRowsCount,
  deletable,
  onBulkDelete,
  isDeleting,
  actionButton,
  customActions,
  layout,
  onLayoutChange,
  showLayoutSwitcher = true,
}: DataCardToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
      {/* Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        {searchConfig?.globalSearch || searchConfig?.searchableKey ? (
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={searchConfig.placeholder || "Search..."}
              value={globalFilter ?? ""}
              onChange={(event) => onGlobalFilterChange?.(event.target.value)}
              className="pl-10 pr-10"
            />
            {globalFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onGlobalFilterChange?.("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {/* Right side actions */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2 sm:justify-end">
        {/* Layout Switcher */}
        {showLayoutSwitcher && onLayoutChange && (
          <div className="hidden sm:flex items-center border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLayoutChange("grid")}
              className={cn(
                "h-9 px-3 rounded-r-none",
                layout === "grid" && "bg-accent"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLayoutChange("list")}
              className={cn(
                "h-9 px-3 rounded-l-none border-l",
                layout === "list" && "bg-accent"
              )}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Bulk Delete Button */}
        {selectable && hasSelection && deletable && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                className="whitespace-nowrap"
              >
                <Trash2 className="h-4 w-4" />
                Delete {selectedRowsCount}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete{" "}
                  {selectedRowsCount}{" "}
                  {selectedRowsCount === 1 ? "item" : "items"} from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onBulkDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Global Filter */}
        {filterConfig && Object.keys(filterConfig).length > 0 && (
          <GlobalFilter config={filterConfig} />
        )}

        {/* Custom Action Button (e.g., Add Brand) */}
        {(() => {
          const customCreate = customActions?.find(
            (a) => a.type === "create" && a.placement === "header"
          );
          if (customCreate) {
            const href =
              typeof customCreate.href === "function"
                ? customCreate.href()
                : customCreate.href;
            const button = (
              <Button
                variant={customCreate.variant || "default"}
                size="sm"
                onClick={
                  customCreate.onClick
                    ? () => customCreate.onClick?.()
                    : undefined
                }
                className="whitespace-nowrap"
              >
                {customCreate.icon}
                {customCreate.label}
              </Button>
            );
            return href ? <Link href={href}>{button}</Link> : button;
          }
          return actionButton ? (
            <Button
              variant={actionButton.variant || "default"}
              size="sm"
              onClick={actionButton.onClick}
              className="whitespace-nowrap"
            >
              {actionButton.icon}
              {actionButton.label}
            </Button>
          ) : null;
        })()}

        {/* Other custom header actions */}
        {customActions
          ?.filter((a) => a.placement === "header" && a.type !== "create")
          .map((action, index) => {
            const href =
              typeof action.href === "function" ? action.href() : action.href;
            const button = (
              <Button
                variant={action.variant || "default"}
                size="sm"
                onClick={
                  action.onClick ? () => action.onClick?.() : undefined
                }
                className="whitespace-nowrap"
              >
                {action.icon}
                {action.label}
              </Button>
            );
            return href ? (
              <Link key={`header-${index}`} href={href}>
                {button}
              </Link>
            ) : (
              <span key={`header-${index}`}>{button}</span>
            );
          })}
      </div>
    </div>
  );
}
