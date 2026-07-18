"use client";

import { Trash2, LayoutGrid, List, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/components/dropdown-menu";
import { FilterBar } from "@/ui/components/filters/filter-bar";
import { FilterConfig, CardCustomAction, CardLayout, CardSortingConfig } from "@/types/DataCard";
import { cn } from "@/ui/lib/utils";

interface DataCardToolbarProps {
  title?: string;
  filterConfig?: FilterConfig;
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
  // Sorting
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  sortingConfig?: CardSortingConfig;
}

export function DataCardToolbar({
  title,
  filterConfig,
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
  showLayoutSwitcher = false,
  sortBy,
  sortOrder,
  onSortChange,
  sortingConfig,
}: DataCardToolbarProps) {
  const hasInlineFilters = !!filterConfig?.fields?.length;
  const hasRightActions =
    (selectable && hasSelection && deletable) ||
    sortingConfig ||
    (showLayoutSwitcher && !!onLayoutChange) ||
    !!actionButton ||
    customActions?.some((a) => a.placement === "header");

  if (!title && !hasInlineFilters && !hasRightActions) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* Title — mr-auto pushes right items to the end when no inline filter
          bar owns the flex-1 spacer. */}
      {title && (
        <h2
          className={cn(
            "text-xl font-semibold tracking-tight",
            !hasInlineFilters && "mr-auto",
          )}
        >
          {title}
        </h2>
      )}

      {/* Inline filter bar — search + inline filters, overflow folds to panel */}
      {hasInlineFilters && filterConfig && <FilterBar config={filterConfig} />}

      {/* Right-side actions */}
      {hasRightActions && (
        <div className={cn(
          "flex items-center gap-2 shrink-0",
          !title && !hasInlineFilters && "ml-auto"
        )}>
        {/* Sort Dropdown */}
        {sortingConfig && onSortChange && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <ArrowUpDown className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {sortBy
                    ? sortingConfig.sortOptions.find((o) => o.field === sortBy)?.label || "Sort"
                    : "Sort"}
                </span>
                {sortBy && (
                  sortOrder === "asc"
                    ? <ArrowUp className="h-3 w-3" />
                    : <ArrowDown className="h-3 w-3" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {sortingConfig.sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.field}
                  onClick={() => {
                    if (sortBy === option.field) {
                      // Toggle direction
                      onSortChange(option.field, sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      // New field — default to ascending
                      onSortChange(option.field, "asc");
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between",
                    sortBy === option.field && "font-medium"
                  )}
                >
                  {option.label}
                  {sortBy === option.field && (
                    sortOrder === "asc"
                      ? <ArrowUp className="h-3.5 w-3.5 ml-2" />
                      : <ArrowDown className="h-3.5 w-3.5 ml-2" />
                    )}
                </DropdownMenuItem>
              ))}
              {sortBy && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onSortChange("", "desc")}
                    className="text-muted-foreground"
                  >
                    Clear sort
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Layout Switcher */}
        {showLayoutSwitcher && onLayoutChange && (
          <div className="hidden sm:flex items-center border rounded-md h-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLayoutChange("grid")}
              className={cn(
                "h-8 px-3 rounded-r-none",
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
                "h-8 px-3 rounded-l-none border-l",
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
      )}
    </div>
  );
}
