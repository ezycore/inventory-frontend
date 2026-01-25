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
import { organizationApi } from "@/lib/api"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/use-auth-store"
import { useQueryClient } from "@tanstack/react-query"
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
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const excludedColumns = user?.organization?.settings?.excludedColumns?.[module] || []

  const handleSave = async (excludedCols: string[]) => {
    setIsLoading(true)
    try {
      const response = await organizationApi.updateColumnSettings({
        [module]: excludedCols,
      })

      if (response.success) {
        // Refetch user data to get updated settings
        await queryClient.invalidateQueries({ queryKey: ["user", "me"] })
        
        toast.success("Column settings saved successfully")
        onOpenChange(false)
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save column settings")
    } finally {
      setIsLoading(false)
    }
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
