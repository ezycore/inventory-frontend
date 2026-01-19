import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Button } from "../button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip";
import { DataTableAction, CustomAction } from "@/types/DataTable";

interface UseEnhancedColumnsProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  selectable?: boolean;
  actions?: DataTableAction;
  onView?: (row: TData) => void;
  onEdit?: (row: TData) => void;
  openDeleteDialog?: (row: TData) => void;
  customActions?: CustomAction[];
}

export function useEnhancedColumns<TData, TValue>({
  columns,
  selectable,
  actions,
  onView,
  onEdit,
  openDeleteDialog,
  customActions,
}: UseEnhancedColumnsProps<TData, TValue>) {
  return useMemo(() => {
    const cols = [...columns];
    
    // Add selection column
    if (selectable && !cols.some((col: any) => col.id === "select")) {
      cols.unshift({
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={row.getIsSelected()}
              onChange={(e) => row.toggleSelected(!!e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      } as ColumnDef<TData, TValue>);
    }
    
    // Add actions column
    if (actions && !cols.some((col: any) => col.id === "actions")) {
      cols.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const rowData = row.original;
          return (
            <div className="flex items-center gap-2">
              {actions.viewable && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView?.(rowData)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {typeof actions.viewable === "object" && actions.viewable.tooltip
                        ? actions.viewable.tooltip
                        : "View details"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {(() => {
                const customEdit = customActions?.find(a => a.type === 'edit');
        
                return (actions.editable || customEdit) ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => customEdit?.onClick ? customEdit.onClick(rowData) : onEdit?.(rowData)}
                          className="h-8 w-8 p-0"
                        >
                          {customEdit?.icon || <Edit className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {typeof actions.editable === "object" && actions.editable.tooltip
                          ? actions.editable.tooltip
                          : customEdit?.tooltip || "Edit"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null;
              })()}
              
              {actions.deletable && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog?.(rowData)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {typeof actions.deletable === "object" && actions.deletable.tooltip
                        ? actions.deletable.tooltip
                        : "Delete"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {actions.custom?.map((action, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={action.variant || "ghost"}
                        size="sm"
                        onClick={() => action.onClick(rowData)}
                        className="h-8 w-8 p-0"
                      >
                        {action.icon || <MoreHorizontal className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    {action.tooltip && <TooltipContent>{action.tooltip}</TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              ))}
              
              {/* Custom cell actions (excluding built-in types) */}
              {customActions?.filter(a => a.placement === 'cell' && !['edit', 'view', 'delete'].includes(a.type)).map((action, index) => {
                // If custom render is provided, use it
                if (action.render) {
                  return (
                    <div key={`custom-${index}`}>
                      {action.render(rowData)}
                    </div>
                  );
                }
                
                const href = typeof action.href === 'function' ? action.href(rowData) : action.href;
                const ButtonComponent = (
                  <Button
                    variant={action.variant || "ghost"}
                    size="sm"
                    onClick={action.onClick ? () => action.onClick?.(rowData) : undefined}
                    className="h-8 w-8 p-0"
                  >
                    {action.icon || <MoreHorizontal className="h-4 w-4" />}
                  </Button>
                );
                
                return (
                  <TooltipProvider key={`custom-${index}`}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {href ? <Link href={href}>{ButtonComponent}</Link> : ButtonComponent}
                      </TooltipTrigger>
                      {action.tooltip && <TooltipContent>{action.tooltip}</TooltipContent>}
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      } as ColumnDef<TData, TValue>);
    }
    
    return cols;
  }, [columns, selectable, actions, onView, onEdit, openDeleteDialog, customActions]);
}
