import { Search, X, Trash2, ChevronDown, Settings } from "lucide-react";
import { Table } from "@tanstack/react-table";
import Link from "next/link";
import { Input } from "../input";
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
import { GlobalFilter } from "../filters/global-filter";
import { DataTableSearchConfig, FilterConfig, CustomAction } from "@/types/DataTable";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  filterConfig?: FilterConfig;
  searchConfig?: DataTableSearchConfig;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
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
  enableColumnVisibility,
  actionButton,
  customActions,
  manageColumns,
  onColumnSettingsClick,
}: DataTableToolbarProps<TData>) {

  if(!searchConfig?.globalSearch || !searchConfig?.searchableColumn || !(filterConfig && Object.keys(filterConfig).length > 0) || !(selectable && hasSelection && deletable) || !enableColumnVisibility || !manageColumns)  return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
      {/* Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        {searchConfig?.globalSearch ? (
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={searchConfig.placeholder || "Search all columns..."}
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
        ) : searchConfig?.searchableColumn ? (
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={searchConfig.placeholder || "Search..."}
              value={
                (table
                  .getColumn(searchConfig.searchableColumn as string)
                  ?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table
                  .getColumn(searchConfig.searchableColumn as string)
                  ?.setFilterValue(event.target.value)
              }
              className="pl-10 pr-10"
            />
            {table.getColumn(searchConfig.searchableColumn as string)?.getFilterValue() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  table.getColumn(searchConfig.searchableColumn as string)?.setFilterValue("")
                }
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
                  This action cannot be undone. This will permanently delete {selectedRowsCount} {selectedRowsCount === 1 ? 'item' : 'items'} from the database.
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

        {/* Column Visibility */}
        {enableColumnVisibility && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="whitespace-nowrap">
              <ChevronDown className="h-4 w-4 mr-2" />
              Columns
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
            Columns
          </Button>
        )}

        {
        (filterConfig && Object.keys(filterConfig).length > 0) && (
          <GlobalFilter
            config={filterConfig}
          />
        )
        }
        {/* Custom Action Button (e.g., Add Brand) - Always on the right */}
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
    </div>
  );
}
