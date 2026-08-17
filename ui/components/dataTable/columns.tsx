import { useMemo } from "react";
import { useTranslations } from "next-intl";
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
  /** When server-side sorting is active, only these column fields may be sorted */
  serverSortableFields?: string[];
}

export function useEnhancedColumns<TData, TValue>({
  columns,
  selectable,
  actions,
  onView,
  onEdit,
  openDeleteDialog,
  customActions,
  serverSortableFields,
}: UseEnhancedColumnsProps<TData, TValue>) {
  const t = useTranslations("common");
  return useMemo(() => {
    // When server-side sorting is active, restrict sortable columns to allowed fields only
    const cols = serverSortableFields
      ? columns.map((col) => {
          const colId = (col as any).accessorKey ?? (col as any).id ?? "";
          const isAllowed = serverSortableFields.includes(colId);
          if (!isAllowed) {
            return { ...col, enableSorting: false };
          }
          return col;
        })
      : [...columns];
    
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
    
    // Add actions column (only if there are actual action buttons to show)
    const hasActions = (actions && (actions.viewable || actions.editable || actions.deletable)) || (customActions && customActions.length > 0);
    if (hasActions && !cols.some((col: any) => col.id === "actions")) {
      cols.push({
        id: "actions",
        header: t("table.actions"),
        cell: ({ row }) => {
          const rowData = row.original;
          return (
            <div className="flex items-center gap-2">
              {actions?.viewable && (() => {
                // One label for the tooltip AND the accessible name. These
                // buttons are icon-only and were labelled by the tooltip alone,
                // which is `aria-describedby` when open — never a name. A
                // screen reader announced "button", on every list in the app.
                const label =
                  typeof actions?.viewable === "object" && actions?.viewable?.tooltip
                    ? actions.viewable.tooltip
                    : t("actions.viewDetails");
                return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={label}
                        onClick={() => onView?.(rowData)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                );
              })()}
              
              {(() => {
                const customEdit = customActions?.find(a => a.type === 'edit');
                const label =
                  typeof actions?.editable === "object" && actions?.editable?.tooltip
                    ? actions.editable.tooltip
                    : customEdit?.tooltip || t("actions.edit");

                return (actions?.editable || customEdit) ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={label}
                          onClick={() => customEdit?.onClick ? customEdit.onClick(rowData) : onEdit?.(rowData)}
                          className="h-8 w-8 p-0"
                        >
                          {customEdit?.icon || <Edit className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{label}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : null;
              })()}
              
              {actions?.deletable && (() => {
                const label =
                  typeof actions?.deletable === "object" && actions?.deletable?.tooltip
                    ? actions.deletable.tooltip
                    : t("actions.delete");
                return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={label}
                        onClick={() => openDeleteDialog?.(rowData)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{label}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                );
              })()}
              
              {actions?.custom?.map((action, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={action.variant || "ghost"}
                        size="sm"
                        // `label` is the declared name; `tooltip` is the hover
                        // text. Either serves as the accessible name — an
                        // icon-only button must have one.
                        aria-label={action.label || action.tooltip}
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
                const isHidden = action.hidden ?
                  (typeof action.hidden === 'function' ? action.hidden(rowData) : action.hidden)
                  : false;
                if (isHidden) return null;
                // If custom render is provided, use it
                if (action.render) {
                  return (
                    <div key={`custom-${index}`}>
                      {action.render(rowData)}
                    </div>
                  );
                }
                
                // Check if button should be disabled
                const isDisabled = action.disabled ? 
                  (typeof action.disabled === 'function' ? action.disabled(rowData) : action.disabled) 
                  : false;
                
                const href = typeof action.href === 'function' ? action.href(rowData) : action.href;
                const ButtonComponent = (
                  <Button
                    variant={action.variant || "ghost"}
                    size="sm"
                    aria-label={action.label || action.tooltip}
                    onClick={action.onClick ? () => action.onClick?.(rowData) : undefined}
                    disabled={isDisabled}
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
                      {(action.tooltip || action.label) && <TooltipContent>{action.tooltip || action.label}</TooltipContent>}
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
  }, [columns, selectable, actions, onView, onEdit, openDeleteDialog, customActions, serverSortableFields, t]);
}
