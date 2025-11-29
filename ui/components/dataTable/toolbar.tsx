import { Search, X, Trash2, ChevronDown } from "lucide-react";
import { Table } from "@tanstack/react-table";
import { Input } from "../input";
import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../dropdown-menu";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchConfig?: {
    searchableColumn?: keyof TData;
    placeholder?: string;
    globalSearch?: boolean;
  };
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
}

export function DataTableToolbar<TData>({
  table,
  searchConfig,
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
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex items-center justify-between gap-4">
      {/* Search */}
      <div className="flex items-center gap-4 flex-1">
        {searchConfig?.globalSearch ? (
          <div className="relative flex-1 max-w-sm">
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
          <div className="relative flex-1 max-w-sm">
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
      <div className="flex items-center gap-2">
        {/* Bulk Delete Button */}
        {selectable && hasSelection && deletable && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {selectedRowsCount}
          </Button>
        )}

        {/* Column Visibility */}
        {enableColumnVisibility && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
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

        {/* Custom Action Button (e.g., Add Brand) - Always on the right */}
        {actionButton && (
          <Button
            variant={actionButton.variant || "default"}
            size="sm"
            onClick={actionButton.onClick}
          >
            {actionButton.icon}
            {actionButton.label}
          </Button>
        )}
      </div>
    </div>
  );
}
