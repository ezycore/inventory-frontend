"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog"
import { ColumnSettingsManager } from "./column-settings-manager"
import { useColumnSettingsStore } from "@/services/stores/use-column-settings-store"
import { useUpdateColumnSettings } from "@/services/api"
import type { ColumnDef } from "@tanstack/react-table"

interface ColumnSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnDef<any>[]
  module: string
}

export function ColumnSettingsModal({
  open,
  onOpenChange,
  columns,
  module,
}: ColumnSettingsModalProps) {
  const excludedColumns = useColumnSettingsStore((state) =>
    state.getExcludedColumnsForModule(module)
  )
  const updateModuleExcludedColumns = useColumnSettingsStore(
    (state) => state.updateModuleExcludedColumns
  )
  const { mutate: updateColumnSettings, isPending: isLoading } = useUpdateColumnSettings()

  const handleSave = (excludedColumnsList: string[]) => {
    updateColumnSettings(
      { [module]: excludedColumnsList },
      {
        onSuccess: () => {
          updateModuleExcludedColumns(module, excludedColumnsList)
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Table Columns</DialogTitle>
          <DialogDescription>
            Customize which columns are visible in the {module} table
          </DialogDescription>
        </DialogHeader>
        <ColumnSettingsManager
          columns={columns}
          module={module}
          excludedColumns={excludedColumns}
          onSave={handleSave}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  )
}
