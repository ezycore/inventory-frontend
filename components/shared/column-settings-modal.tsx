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
import { useColumnSettingsStore } from "@/stores/use-column-settings-store"
import { organizationApi } from "@/lib/api"
import { toast } from "sonner"
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
  const [isLoading, setIsLoading] = useState(false)
  const excludedColumns = useColumnSettingsStore((state) =>
    state.getExcludedColumnsForModule(module)
  )
  const updateModuleExcludedColumns = useColumnSettingsStore(
    (state) => state.updateModuleExcludedColumns
  )

  const handleSave = async (excludedColumnsList: string[]) => {
    setIsLoading(true)
    try {
      await organizationApi.updateColumnSettings({ [module]: excludedColumnsList })
      updateModuleExcludedColumns(module, excludedColumnsList)
      toast.success("Column settings saved successfully")
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to save column settings")
    } finally {
      setIsLoading(false)
    }
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
