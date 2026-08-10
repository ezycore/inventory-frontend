import { Trash2, ChevronDown, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { Table } from "@tanstack/react-table";
import Link from "next/link";
import { cn } from "@/ui/lib/utils";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../dropdown-menu";
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
} from "../alert-dialog";
import { FilterBar } from "../filters/filter-bar";
import { FilterConfig, CustomAction } from "@/types/DataTable";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  title?: string;
  filterConfig?: FilterConfig;
  selectable?: boolean;
  hasSelection?: boolean;
  selectedRowsCount?: number;
  deletable?: boolean;
  onBulkDelete?: () => void;
  isDeleting?: boolean;
  enableColumnVisibility?: boolean;
  actionButton?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  customActions?: CustomAction[];
  manageColumns?: boolean;
  onColumnSettingsClick?: () => void;
}

export function DataTableToolbar<TData>({
  table,
  title,
  filterConfig,
  selectable,
  hasSelection,
  selectedRowsCount,
  deletable,
  onBulkDelete,
  isDeleting,
  enableColumnVisibility,
  actionButton,
  customActions,
  manageColumns,
  onColumnSettingsClick,
}: DataTableToolbarProps<TData>) {
  const t = useTranslations("common");

  const hasInlineFilters = !!filterConfig?.fields?.length;
  const hasRightActions =
    (selectable && hasSelection && deletable) ||
    enableColumnVisibility ||
    manageColumns ||
    !!actionButton ||
    customActions?.some((a) => a.placement === "header");

  if (!title && !hasRightActions && !hasInlineFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {/* Title — mr-auto pushes right items to the end of the same row.
          When the row is too narrow, following items wrap to the next row(s). */}
      {title && (
        <h2
          className={cn(
            "text-xl font-semibold tracking-tight",
            // FilterBar (flex-1) owns the spacer when inline filters render;
            // otherwise mr-auto pushes the right-side actions to the end.
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
        // flex-wrap, not shrink-0: on a phone the button row is wider than the
        // viewport, and a non-wrapping shrink-0 row made the whole page scroll
        // sideways instead of stacking.
        <div className={cn(
          "flex min-w-0 flex-wrap items-center gap-2",
          !title && !hasInlineFilters && "ml-auto"
        )}>
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
                {t("table.deleteCount", { count: selectedRowsCount })}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("confirm.titleStrong")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("confirm.deleteCountItems", { count: selectedRowsCount })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onBulkDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? t("confirm.deleting") : t("actions.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Column Visibility */}
        {enableColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <ChevronDown className="h-4 w-4 mr-2" />
                {t("table.columns")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Column Settings Button */}
        {manageColumns && onColumnSettingsClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onColumnSettingsClick}
            className="whitespace-nowrap"
          >
            <Settings className="h-4 w-4" />
            {t("table.columns")}
          </Button>
        )}

        {/* Primary action button */}
        {(() => {
          const customCreate = customActions?.find(a => a.type === 'create' && a.placement === 'header');
          if (customCreate) {
            const href = typeof customCreate.href === 'function' ? customCreate.href() : customCreate.href;
            const button = (
              <Button
                variant={customCreate.variant || "default"}
                size="sm"
                onClick={customCreate.onClick ? () => customCreate.onClick?.() : undefined}
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
        {customActions?.filter(a => a.placement === 'header' && a.type !== 'create').map((action, index) => {
          const href = typeof action.href === 'function' ? action.href() : action.href;
          const button = (
            <Button
              variant={action.variant || "default"}
              size="sm"
              onClick={action.onClick ? () => action.onClick?.() : undefined}
              className="whitespace-nowrap"
            >
              {action.icon}
              {action.label}
            </Button>
          );
          return href ? (
            <Link key={`header-${index}`} href={href}>{button}</Link>
          ) : (
            <span key={`header-${index}`}>{button}</span>
          );
        })}
        </div>
      )}
    </div>
  );
}
