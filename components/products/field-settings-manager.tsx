"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/components/card"
import { Switch } from "@/ui/components/switch"
import { Button } from "@/ui/components/button"
import { Label } from "@/ui/components/label"
import { Input } from "@/ui/components/input"
import { Textarea } from "@/ui/components/textarea"
import { Badge } from "@/ui/components/badge"
import { Separator } from "@/ui/components/separator"
import { cn } from "@/ui/lib/utils"
import {
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Settings2,
  AlertCircle,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/ui/components/collapsible"
import type { DynamicFormConfig, FormFieldConfig, FormSection } from "@/ui/components/form/type"

interface FieldSettingsManagerProps {
  formConfig: DynamicFormConfig
  module: string
  excludedFields: string[]
  onSave: (excludedFields: string[]) => Promise<void>
  isLoading?: boolean
}

interface FieldPreviewProps {
  field: FormFieldConfig
  isExcluded: boolean
}

// Preview how the field would look in a form (simplified)
function FieldPreview({ field, isExcluded }: FieldPreviewProps) {
  const renderPreview = () => {
    switch (field.type) {
      case "input":
      case "number":
        return (
          <Input
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            disabled
            className="opacity-70"
          />
        )
      case "textarea":
        return (
          <Textarea
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            disabled
            rows={2}
            className="opacity-70"
          />
        )
      case "select":
        return (
          <div className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground opacity-70">
            {field.placeholder || `Select ${field.label.toLowerCase()}`}
            <ChevronDown className="h-4 w-4" />
          </div>
        )
      case "radio-group":
        return (
          <div className="flex gap-4 opacity-70">
            {(field.options?.slice(0, 3) || []).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border border-input" />
                <span className="text-sm text-muted-foreground">{opt.label}</span>
              </div>
            ))}
          </div>
        )
      case "checkbox":
        return (
          <div className="flex items-center gap-2 opacity-70">
            <div className="h-4 w-4 rounded border border-input" />
            <span className="text-sm text-muted-foreground">{field.label}</span>
          </div>
        )
      case "file-upload":
        return (
          <div className="flex h-20 w-full items-center justify-center rounded-md border-2 border-dashed border-input opacity-70">
            <span className="text-sm text-muted-foreground">Drop files here</span>
          </div>
        )
      case "custom":
        return (
          <div className="flex h-12 w-full items-center justify-center rounded-md border border-dashed border-input opacity-70">
            <span className="text-sm text-muted-foreground">Custom component</span>
          </div>
        )
      default:
        return (
          <Input placeholder={field.placeholder} disabled className="opacity-70" />
        )
    }
  }

  return (
    <div className={cn("space-y-2", isExcluded && "opacity-50")}>
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {isExcluded && (
          <Badge variant="secondary" className="text-xs">
            Hidden
          </Badge>
        )}
      </div>
      {renderPreview()}
      {field.helperText && (
        <p className="text-xs text-muted-foreground">{typeof field.helperText === "function" ? field.helperText({}) : field.helperText}</p>
      )}
    </div>
  )
}

export function FieldSettingsManager({
  formConfig,
  module,
  excludedFields: initialExcludedFields,
  onSave,
  isLoading = false,
}: FieldSettingsManagerProps) {
  const [excludedFields, setExcludedFields] = useState<string[]>(initialExcludedFields)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sync with prop changes
  useEffect(() => {
    setExcludedFields(initialExcludedFields)
  }, [initialExcludedFields])

  // Get all fields from sections or flat fields
  const allFields = useMemo(() => {
    if (formConfig.sections) {
      return formConfig.sections.flatMap((section) => section.fields || [])
    }
    return formConfig.fields || []
  }, [formConfig])

  // Get included (visible) fields
  const includedFields = useMemo(() => {
    return allFields.filter((field) => !excludedFields.includes(field.name))
  }, [allFields, excludedFields])

  // Get excluded (hidden) fields
  const hiddenFields = useMemo(() => {
    return allFields.filter((field) => excludedFields.includes(field.name))
  }, [allFields, excludedFields])

  // Toggle field inclusion
  const toggleField = (fieldName: string) => {
    setExcludedFields((prev) => {
      const isCurrentlyExcluded = prev.includes(fieldName)
      const newValue = isCurrentlyExcluded
        ? prev.filter((f) => f !== fieldName)
        : [...prev, fieldName]
      return newValue
    })
    setHasChanges(true)
  }

  // Toggle section
  const toggleSection = (sectionTitle: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }))
  }

  // Handle save
  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(excludedFields)
      setHasChanges(false)
    } finally {
      setSaving(false)
    }
  }

  // Handle reset
  const handleReset = () => {
    setExcludedFields(initialExcludedFields)
    setHasChanges(false)
  }

  // Required fields that cannot be excluded
  const requiredFields = useMemo(() => {
    return allFields.filter((f) => f.required).map((f) => f.name)
  }, [allFields])

  const isFieldRequired = (fieldName: string) => requiredFields.includes(fieldName)

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Field Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Customize which fields appear in the {module} form for your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="outline" size="sm" onClick={handleReset} disabled={saving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || saving || isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="py-4">
          <CardContent className="py-0">
            <div className="text-2xl font-bold">{allFields.length}</div>
            <p className="text-xs text-muted-foreground">Total Fields</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="py-0">
            <div className="text-2xl font-bold text-green-600">{includedFields.length}</div>
            <p className="text-xs text-muted-foreground">Visible Fields</p>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="py-0">
            <div className="text-2xl font-bold text-orange-600">{hiddenFields.length}</div>
            <p className="text-xs text-muted-foreground">Hidden Fields</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content - two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - All fields with switches */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" />
              All Available Fields
            </CardTitle>
            <CardDescription>
              Toggle the switch to show or hide fields in the form
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formConfig.sections ? (
              formConfig.sections.map((section, sectionIndex) => (
                <Collapsible
                  key={sectionIndex}
                  open={openSections[section.title] !== false}
                  onOpenChange={() => toggleSection(section.title)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-2 h-auto"
                    >
                      <div className="flex items-center gap-2">
                        {section.icon}
                        <span className="font-medium">{section.title}</span>
                        <Badge variant="outline" className="ml-2">
                          {section.fields?.length || 0} fields
                        </Badge>
                      </div>
                      {openSections[section.title] !== false ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
                    {section.fields?.map((field) => (
                      <FieldToggleItem
                        key={field.name}
                        field={field}
                        isExcluded={excludedFields.includes(field.name)}
                        isRequired={isFieldRequired(field.name)}
                        onToggle={() => toggleField(field.name)}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))
            ) : (
              <div className="space-y-2">
                {allFields.map((field) => (
                  <FieldToggleItem
                    key={field.name}
                    field={field}
                    isExcluded={excludedFields.includes(field.name)}
                    isRequired={isFieldRequired(field.name)}
                    onToggle={() => toggleField(field.name)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column - Preview of visible fields */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4 text-green-600" />
              Visible Fields Preview
            </CardTitle>
            <CardDescription>
              These fields will appear in the form for your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {includedFields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <EyeOff className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No visible fields. Toggle some fields to make them appear in the form.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {formConfig.sections
                  ? formConfig.sections.map((section, idx) => {
                      const visibleSectionFields =
                        section.fields?.filter(
                          (f) => !excludedFields.includes(f.name)
                        ) || []
                      if (visibleSectionFields.length === 0) return null
                      return (
                        <div key={idx} className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            {section.icon}
                            {section.title}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4 border-l-2 border-muted">
                            {visibleSectionFields.map((field) => (
                              <FieldPreview
                                key={field.name}
                                field={field}
                                isExcluded={false}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })
                  : includedFields.map((field) => (
                      <FieldPreview
                        key={field.name}
                        field={field}
                        isExcluded={false}
                      />
                    ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hidden fields summary */}
      {hiddenFields.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <EyeOff className="h-4 w-4" />
              Hidden Fields ({hiddenFields.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {hiddenFields.map((field) => (
                <Badge
                  key={field.name}
                  variant="outline"
                  className="cursor-pointer hover:bg-background transition-colors"
                  onClick={() => toggleField(field.name)}
                >
                  {field.label}
                  <span className="ml-1 text-xs">×</span>
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Click on a badge to make the field visible again
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Individual field toggle item
interface FieldToggleItemProps {
  field: FormFieldConfig
  isExcluded: boolean
  isRequired: boolean
  onToggle: () => void
}

function FieldToggleItem({
  field,
  isExcluded,
  isRequired,
  onToggle,
}: FieldToggleItemProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-colors",
        isExcluded
          ? "bg-muted/50 border-muted"
          : "bg-background border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("font-medium text-sm", isExcluded && "text-muted-foreground")}>
              {field.label}
            </span>
            {isRequired && (
              <Badge variant="destructive" className="text-xs h-5">
                Required
              </Badge>
            )}
            <Badge variant="secondary" className="text-xs h-5">
              {field.type}
            </Badge>
          </div>
          {field.helperText && (
            <p className="text-xs text-muted-foreground mt-0.5">{typeof field.helperText === "function" ? field.helperText({}) : field.helperText}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isRequired && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Can&apos;t hide
          </span>
        )}
        <Switch
          checked={!isExcluded}
          onCheckedChange={onToggle}
          disabled={isRequired}
          aria-label={`Toggle ${field.label} visibility`}
        />
      </div>
    </div>
  )
}

export default FieldSettingsManager
