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
import { useAuthStore } from "@/services/stores/use-auth-store"
import { useUpdateColumnSettings } from "@/services/api"
import type { ColumnDef } from "@tanstack/react-table"

interface ColumnSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: ColumnDef<any>[]
  module: string
}

export function ColumnSettingsDialog({
  open,
  onOpenChange,
  columns,
  module,
}: ColumnSettingsDialogProps) {
  const user = useAuthStore((state) => state.user)
  const excludedColumns = user?.organization?.settings?.excludedColumns?.[module] || []
  const { mutate: updateColumnSettings, isPending: isLoading } = useUpdateColumnSettings()

  const handleSave = (excludedCols: string[]) => {
    updateColumnSettings(
      { [module]: excludedCols },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Column Settings - {module.charAt(0).toUpperCase() + module.slice(1)}</DialogTitle>
          <DialogDescription>
            Configure which columns are visible in the {module} table
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
