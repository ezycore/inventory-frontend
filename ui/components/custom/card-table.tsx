"use client";

import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/components/table";
import { cn } from "@/ui/lib/utils";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { EasyAlertDialog } from "./easy-alert-dialog";

interface TableAction {
  label: string;
  onClick: () => void;
  variant?:
    | "default"
    | "outline"
    | "destructive"
    | "secondary"
    | "ghost"
    | "link";
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  confirmationDescription?: string;
  confirmLabel?: string;
  className?: string;
}

interface CardTableProps<TData, TValue = any> {
  // Card Props
  title?: React.ReactNode;
  description?: React.ReactNode;
  headerAction?: React.ReactNode;

  // Table Props
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  isLoading?: boolean;
  rowClassName?: string | ((row: TData) => string);

  // Footer Actions
  actions?: TableAction[];
  footerContent?: React.ReactNode;

  // Styling
  className?: string;
  tableClassName?: string;
  showCard?: boolean;
}

/**
 * CardTable - Comprehensive table component with Card wrapper
 *
 * Features:
 * - Card wrapper with title, description, and header actions
 * - Table with columns and data
 * - Footer with multiple configurable actions
 * - Built-in confirmation dialogs
 * - Loading and empty states
 * - Fully customizable styling
 *
 * @example
 * ```tsx
 * <CardTable
 *   title="Items to Adjust"
 *   description="Review items before submitting"
 *   columns={columns}
 *   data={items}
 *   headerAction={<Button>Delete All</Button>}
 *   actions={[
 *     {
 *       label: "Clear All",
 *       onClick: handleClear,
 *       variant: "outline"
 *     },
 *     {
 *       label: "Submit All",
 *       onClick: handleSubmit,
 *       variant: "default",
 *       loading: isSubmitting,
 *       requiresConfirmation: true,
 *       confirmationTitle: "Confirm Submission",
 *       confirmationDescription: "Are you sure?"
 *     }
 *   ]}
 * />
 * ```
 */
export function CardTable<TData, TValue = any>({
  title,
  description,
  headerAction,
  columns,
  data,
  emptyMessage = "No data available",
  isLoading = false,
  rowClassName,
  actions,
  footerContent,
  className,
  tableClassName,
  showCard = true,
}: CardTableProps<TData, TValue>) {
  const [confirmationState, setConfirmationState] = useState<{
    open: boolean;
    action: TableAction | null;
  }>({ open: false, action: null });
  // Memoize columns to prevent unnecessary re-renders
  const memoizedColumns = useMemo(() => columns, [columns]);

  // Note: React Compiler warning about useReactTable is expected and safe to ignore
  // This is a known behavior with TanStack Table - the component will work correctly
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table is known to work correctly despite this warning
  const table = useReactTable({
    data,
    columns: memoizedColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleActionClick = (action: TableAction) => {
    if (action.requiresConfirmation) {
      setConfirmationState({ open: true, action });
    } else {
      action.onClick();
    }
  };

  const handleConfirm = () => {
    if (confirmationState.action) {
      confirmationState.action.onClick();
      setConfirmationState({ open: false, action: null });
    }
  };

  const renderTable = () => (
    <>
      <div className={cn("rounded-md border", tableClassName)}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">
                      Loading...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={
                    typeof rowClassName === "function"
                      ? rowClassName(row.original)
                      : rowClassName
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Actions */}
      {(actions && actions.length > 0) || footerContent ? (
        <div className="flex items-center justify-between pt-4">
          {footerContent && <div className="flex-1">{footerContent}</div>}
          {actions && actions.length > 0 && (
            <div className="flex gap-2 ml-auto">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  onClick={() => handleActionClick(action)}
                  disabled={action.disabled || action.loading}
                  className={action.className}
                >
                  {action.loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {action.label}...
                    </>
                  ) : (
                    <>
                      {action.icon && (
                        <span className="mr-2">{action.icon}</span>
                      )}
                      {action.label}
                    </>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </>
  );

  const content = showCard ? (
    <Card className={className}>
      {(title || description || headerAction) && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        </CardHeader>
      )}
      <CardContent>{renderTable()}</CardContent>
    </Card>
  ) : (
    <div className={className}>{renderTable()}</div>
  );

  return (
    <>
      {content}

      {/* Confirmation Dialog */}
      {confirmationState.action && (
        <EasyAlertDialog
          open={confirmationState.open}
          onOpenChange={(open) =>
            setConfirmationState({ open, action: confirmationState.action })
          }
          title={confirmationState.action.confirmationTitle || "Confirm Action"}
          description={
            confirmationState.action.confirmationDescription ||
            "Are you sure you want to proceed?"
          }
          confirmLabel={confirmationState.action.confirmLabel || "Confirm"}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
}
