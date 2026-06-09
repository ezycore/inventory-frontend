"use client"

import React, { useState, useMemo } from "react"
import { Switch } from "@/ui/components/switch"
import { Button } from "@/ui/components/button"
import { Label } from "@/ui/components/label"
import { Badge } from "@/ui/components/badge"
import { Separator } from "@/ui/components/separator"
import { Save, RotateCcw, AlertCircle } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

interface ColumnSettingsManagerProps {
  columns: ColumnDef<any>[]
  module: string
  excludedColumns: string[]
  onSave: (excludedColumns: string[]) => void
  isLoading?: boolean
}

interface ColumnItemProps {
  column: ColumnDef<any>
  columnKey: string
  isExcluded: boolean
  onToggle: () => void
}

// Column item component
function ColumnItem({ column, columnKey, isExcluded, onToggle }: ColumnItemProps) {
  const columnHeader = typeof column.header === "string" ? column.header : columnKey

  return (
    <div className="flex items-center justify-between py-3 px-2">
      <Label className="text-sm font-medium cursor-pointer" onClick={onToggle}>
        {columnHeader}
      </Label>
      <Switch
        checked={!isExcluded}
        onCheckedChange={onToggle}
        aria-label={`Toggle ${columnHeader} column visibility`}
      />
    </div>
  )
}

export function ColumnSettingsManager({
  columns,
  module,
  excludedColumns: initialExcludedColumns,
  onSave,
  isLoading = false,
}: ColumnSettingsManagerProps) {
  const [excludedColumns, setExcludedColumns] = useState<string[]>(initialExcludedColumns)
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Get column keys from columns array
  const columnKeys = useMemo(() => {
    return columns.map((col: any) => col.accessorKey || col.id || "unknown")
  }, [columns])

  // Toggle column visibility
  const toggleColumn = (columnKey: string) => {
    setExcludedColumns((prev) => {
      const isCurrentlyExcluded = prev.includes(columnKey)
      const newValue = isCurrentlyExcluded
        ? prev.filter((c) => c !== columnKey)
        : [...prev, columnKey]
      return newValue
    })
    setHasChanges(true)
  }

  // Handle save
  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(excludedColumns)
      setHasChanges(false)
    } finally {
      setSaving(false)
    }
  }

  // Handle reset
  const handleReset = () => {
    setExcludedColumns(initialExcludedColumns)
    setHasChanges(false)
  }

  return (
    <div className="space-y-4">
      {/* Columns List */}
      <div className="divide-y">
        {columns.map((column, index) => {
          const columnKey = columnKeys[index]
          return (
            <ColumnItem
              key={columnKey}
              column={column}
              columnKey={columnKey}
              isExcluded={excludedColumns.includes(columnKey)}
              onToggle={() => toggleColumn(columnKey)}
            />
          )
        })}
      </div>

      {/* Save Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {hasChanges && (
            <Badge variant="outline" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Unsaved Changes
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || saving}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
