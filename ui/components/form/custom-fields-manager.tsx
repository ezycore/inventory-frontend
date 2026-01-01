'use client'

import { useState, useId } from 'react'
import { useFieldArray, Control } from 'react-hook-form'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Label } from '@ui/components/label'
import { Textarea } from '@ui/components/textarea'
import { Checkbox } from '@ui/components/checkbox'
import { RadioGroup, RadioGroupItem } from '@ui/components/radio-group'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@ui/components/select'

import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@ui/components/dialog'
import { Plus, Trash2, Edit, Settings, X } from 'lucide-react'
import { CustomFieldType, CustomField, CustomFieldOption } from '@/types'
import { toast } from 'sonner'

// Counter for unique IDs
let fieldIdCounter = 0
const generateId = () => `field-${++fieldIdCounter}`

interface CustomFieldsManagerProps {
  control: Control<any>
  name: string
  maxFields?: number
}

interface CustomFieldBuilderProps {
  field?: CustomField
  onSave: (field: CustomField) => void
  onCancel: () => void
  isOpen: boolean
}

const FIELD_TYPE_OPTIONS = [
  { value: CustomFieldType.TEXT, label: 'Text Input' },
  { value: CustomFieldType.NUMBER, label: 'Number Input' },
  { value: CustomFieldType.EMAIL, label: 'Email Input' },
  { value: CustomFieldType.URL, label: 'URL Input' },
  { value: CustomFieldType.DATE, label: 'Date Input' },
  { value: CustomFieldType.TEXTAREA, label: 'Text Area' },
  { value: CustomFieldType.SELECT, label: 'Select Dropdown' },
  { value: CustomFieldType.CHECKBOX, label: 'Checkbox' },
  { value: CustomFieldType.RADIO, label: 'Radio Buttons' },
]

function CustomFieldBuilder({ field, onSave, onCancel, isOpen }: CustomFieldBuilderProps) {
  const reactId = useId()
  const [fieldData, setFieldData] = useState<Partial<CustomField>>(() => ({
    id: field?.id || generateId(),
    label: field?.label || '',
    type: field?.type || CustomFieldType.TEXT,
    value: field?.value || '',
    required: field?.required || false,
    placeholder: field?.placeholder || '',
    options: field?.options || [],
    columnSpan: field?.columnSpan || 6,
    validation: field?.validation || {},
  }))

  const [newOption, setNewOption] = useState({ label: '', value: '' })

  const handleAddOption = () => {
    if (!newOption.label.trim() || !newOption.value.trim()) {
      toast.error('Both label and value are required for options')
      return
    }

    const options = fieldData.options || []
    if (options.some(opt => opt.value === newOption.value)) {
      toast.error('Option value must be unique')
      return
    }

    setFieldData({
      ...fieldData,
      options: [...options, { ...newOption }]
    })
    setNewOption({ label: '', value: '' })
  }

  const handleRemoveOption = (index: number) => {
    const options = fieldData.options || []
    setFieldData({
      ...fieldData,
      options: options.filter((_, i) => i !== index)
    })
  }

  const handleSave = () => {
    if (!fieldData.label?.trim()) {
      toast.error('Field label is required')
      return
    }

    if ([CustomFieldType.SELECT, CustomFieldType.RADIO].includes(fieldData.type!) && 
        (!fieldData.options || fieldData.options.length === 0)) {
      toast.error(`${fieldData.type === CustomFieldType.SELECT ? 'Select' : 'Radio'} field requires at least one option`)
      return
    }

    onSave(fieldData as CustomField)
  }

  const needsOptions = [CustomFieldType.SELECT, CustomFieldType.RADIO].includes(fieldData.type!)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{field ? 'Edit' : 'Add'} Custom Field</DialogTitle>
          <DialogDescription>
            Create a custom field to collect additional product information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Field Label */}
          <div className="space-y-2">
            <Label htmlFor="field-label">Field Label *</Label>
            <Input
              id="field-label"
              value={fieldData.label}
              onChange={(e) => setFieldData({ ...fieldData, label: e.target.value })}
              placeholder="Enter field label"
            />
          </div>

          {/* Field Type */}
          <div className="space-y-2">
            <Label>Field Type *</Label>
            <Select 
              value={fieldData.type} 
              onValueChange={(value) => setFieldData({ 
                ...fieldData, 
                type: value as CustomFieldType,
                options: value === CustomFieldType.CHECKBOX ? [] : fieldData.options
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Placeholder */}
          {![CustomFieldType.CHECKBOX, CustomFieldType.RADIO].includes(fieldData.type!) && (
            <div className="space-y-2">
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={fieldData.placeholder}
                onChange={(e) => setFieldData({ ...fieldData, placeholder: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>
          )}

          {/* Required Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="field-required"
              checked={fieldData.required}
              onCheckedChange={(checked) => setFieldData({ ...fieldData, required: !!checked })}
            />
            <Label htmlFor="field-required" className="cursor-pointer">
              Required field
            </Label>
          </div>

          {/* Column Size */}
          <div className="space-y-2">
            <Label>Column Size</Label>
            <RadioGroup
              value={fieldData.columnSpan?.toString() || "6"}
              onValueChange={(value) => setFieldData({ ...fieldData, columnSpan: parseInt(value) as 6 | 12 })}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="6" id="col-6" />
                <Label htmlFor="col-6" className="cursor-pointer">Half Width (6/12)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="12" id="col-12" />
                <Label htmlFor="col-12" className="cursor-pointer">Full Width (12/12)</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Options for Select/Radio */}
          {needsOptions && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Options</Label>
                <p className="text-sm text-muted-foreground">
                  Add options for {fieldData.type === CustomFieldType.SELECT ? 'dropdown' : 'radio buttons'}
                </p>
              </div>

              {/* Add Option */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    value={newOption.label}
                    onChange={(e) => setNewOption({ ...newOption, label: e.target.value })}
                    placeholder="Option label"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    value={newOption.value}
                    onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                    placeholder="Option value"
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={handleAddOption}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Options List */}
              {fieldData.options && fieldData.options.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {fieldData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <div className="flex-1">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-sm text-muted-foreground ml-2">({option.value})</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Validation Rules */}
          {[CustomFieldType.TEXT, CustomFieldType.NUMBER, CustomFieldType.TEXTAREA].includes(fieldData.type!) && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Validation Rules</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="validation-min">
                    {fieldData.type === CustomFieldType.NUMBER ? 'Minimum Value' : 'Minimum Length'}
                  </Label>
                  <Input
                    id="validation-min"
                    type="number"
                    value={fieldData.validation?.min || ''}
                    onChange={(e) => setFieldData({
                      ...fieldData,
                      validation: {
                        ...fieldData.validation,
                        min: e.target.value ? Number(e.target.value) : undefined
                      }
                    })}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="validation-max">
                    {fieldData.type === CustomFieldType.NUMBER ? 'Maximum Value' : 'Maximum Length'}
                  </Label>
                  <Input
                    id="validation-max"
                    type="number"
                    value={fieldData.validation?.max || ''}
                    onChange={(e) => setFieldData({
                      ...fieldData,
                      validation: {
                        ...fieldData.validation,
                        max: e.target.value ? Number(e.target.value) : undefined
                      }
                    })}
                    placeholder="100"
                  />
                </div>
              </div>

              {fieldData.type === CustomFieldType.TEXT && (
                <div className="space-y-2">
                  <Label htmlFor="validation-pattern">Pattern (Regex)</Label>
                  <Input
                    id="validation-pattern"
                    value={fieldData.validation?.pattern || ''}
                    onChange={(e) => setFieldData({
                      ...fieldData,
                      validation: {
                        ...fieldData.validation,
                        pattern: e.target.value || undefined
                      }
                    })}
                    placeholder="^[a-zA-Z0-9]+$"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="validation-message">Custom Error Message</Label>
                <Input
                  id="validation-message"
                  value={fieldData.validation?.message || ''}
                  onChange={(e) => setFieldData({
                    ...fieldData,
                    validation: {
                      ...fieldData.validation,
                      message: e.target.value || undefined
                    }
                  })}
                  placeholder="Please enter a valid value"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            {field ? 'Update' : 'Add'} Field
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CustomFieldRenderer({ field, value, onChange, error }: {
  field: CustomField
  value: any
  onChange: (value: any) => void
  error?: string
}) {
  const handleChange = (newValue: any) => {
    onChange(newValue)
  }

  const inputProps = {
    id: `custom-field-${field.id}`,
    placeholder: field.placeholder,
    className: error ? 'border-red-500' : '',
  }

  switch (field.type) {
    case CustomFieldType.TEXT:
      return (
        <Input
          {...inputProps}
          type="text"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
        />
      )

    case CustomFieldType.NUMBER:
      return (
        <Input
          {...inputProps}
          type="number"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : '')}
          min={field.validation?.min}
          max={field.validation?.max}
        />
      )

    case CustomFieldType.EMAIL:
      return (
        <Input
          {...inputProps}
          type="email"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
        />
      )

    case CustomFieldType.URL:
      return (
        <Input
          {...inputProps}
          type="url"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
        />
      )

    case CustomFieldType.DATE:
      return (
        <Input
          {...inputProps}
          type="date"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
        />
      )

    case CustomFieldType.TEXTAREA:
      return (
        <Textarea
          {...inputProps}
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          rows={4}
        />
      )

    case CustomFieldType.SELECT:
      return (
        <Select value={value || ''} onValueChange={handleChange}>
          <SelectTrigger className={`w-full ${error ? 'border-red-500' : ''}`}>
            <SelectValue placeholder={field.placeholder || 'Select an option'} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case CustomFieldType.CHECKBOX:
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`custom-field-${field.id}`}
            checked={Boolean(value)}
            onCheckedChange={(checked) => handleChange(!!checked)}
          />
          <Label htmlFor={`custom-field-${field.id}`} className="cursor-pointer">
            {field.placeholder || 'Check this option'}
          </Label>
        </div>
      )

    case CustomFieldType.RADIO:
      return (
        <RadioGroup value={value as string} onValueChange={handleChange}>
          {field.options?.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option.value}
                id={`${field.id}-${option.value}`}
              />
              <Label htmlFor={`${field.id}-${option.value}`} className="cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )

    default:
      return null
  }
}

export default function CustomFieldsManager({ control, name, maxFields = 10 }: CustomFieldsManagerProps) {
  const { fields, append, remove, update } = useFieldArray({
    control,
    name,
  })

  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingField, setEditingField] = useState<{ index: number; field: CustomField } | null>(null)

  const handleAddField = (field: CustomField) => {
    append(field)
    setBuilderOpen(false)
    toast.success('Custom field added successfully')
  }

  const handleEditField = (field: CustomField) => {
    if (editingField !== null) {
      update(editingField.index, field)
      setEditingField(null)
      toast.success('Custom field updated successfully')
    }
  }

  const handleDeleteField = (index: number) => {
    remove(index)
    toast.success('Custom field removed successfully')
  }

  const openEditDialog = (index: number, field: CustomField) => {
    setEditingField({ index, field })
  }

  const closeBuilder = () => {
    setBuilderOpen(false)
    setEditingField(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        {fields.length < maxFields && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setBuilderOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        )}
      </div>

      {/* Existing Fields */}
      {fields.length > 0 && (
        <div className="grid grid-cols-12 gap-3 sm:gap-4 w-full">
          {fields.map((field, index) => {
            const customField = field as CustomField
            const columnSpan = customField.columnSpan || 6
            const colSpanClass = columnSpan === 12 ? 'col-span-12' : 'col-span-12 sm:col-span-6'
            
            return (
              <div key={field.id} className={`${colSpanClass} w-full min-w-0 flex flex-col`}>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor={`custom-field-${customField.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {customField.label}
                    {customField.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => openEditDialog(index, customField)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleDeleteField(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <CustomFieldRenderer
                  field={customField}
                  value={customField.value}
                  onChange={(value) => {
                    const updatedField = { ...customField, value }
                    update(index, updatedField)
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Type: {FIELD_TYPE_OPTIONS.find(opt => opt.value === customField.type)?.label}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {fields.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">No Custom Fields</h3>
          <p className="text-gray-500 mb-4">
            Add custom fields to collect additional information specific to your business needs.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => setBuilderOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Field
          </Button>
        </div>
      )}

      {/* Field Builder Dialog */}
      <CustomFieldBuilder
        field={editingField?.field}
        onSave={editingField ? handleEditField : handleAddField}
        onCancel={closeBuilder}
        isOpen={builderOpen || editingField !== null}
      />
    </div>
  )
}