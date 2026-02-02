'use client'

import React, { useState, useEffect } from 'react'
import { useWatch } from 'react-hook-form'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Label } from '@ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@ui/components/dialog'
import { Checkbox } from '@ui/components/checkbox'
import { toast } from 'sonner'
import { Plus, PlusCircle } from 'lucide-react'
import { useVariantAttributes, useCreateVariantAttribute } from '@/services/api'
import type { VariantAttribute } from '@/types'
import DynamicForm from '@/ui/components/form'
import variantAttributeFormConfig from '../variants/form-config'
import useDynamicForm from '@/hooks/use-dynamic-form'

interface VariantRow {
  id: string
  attributeName: string
  value: string
  sku: string
  costPrice: number
  price: number
  enabled: boolean
}

interface VariantManagerProps {
  control: any // React Hook Form control
  value?: VariantRow[] // Current value from form
  onChange?: (variants: VariantRow[]) => void // Callback to pass data back to form
}

interface EditModalData {
  id: string
  sku: string
  costPrice: number
  price: number
  barcode?: string
  weight?: string
  dimensions?: string
}

export default function VariantManager({
  control,
  value = [],
  onChange,
}: VariantManagerProps) {
  const [selectedAttributeId, setSelectedAttributeId] = useState<string>('')
  const [variants, setVariants] = useState<VariantRow[]>(value)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<EditModalData | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newAttributeName, setNewAttributeName] = useState('')
  const [newAttributeValues, setNewAttributeValues] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  
  // Watch the price field from parent form using useWatch
  const basePrice = useWatch({ control, name: 'price' }) || 0

  // Fetch variant attributes from API
  const { data: attributesResponse, isLoading, error, refetch } = useVariantAttributes()
  const variantAttributes = attributesResponse?.data?.items || []
  const createVariantAttribute = useCreateVariantAttribute()

  const {form: variantCreateForm} = useDynamicForm(variantAttributeFormConfig)
  
  // Update internal state when value prop changes (for edit mode)
  useEffect(() => {
    if (value && value.length > 0 && variants.length === 0) {
      setVariants(value)
    }
  }, [value, variants.length])

  // Generate variants when attribute is selected
  const handleAttributeChange = (attributeId: string) => {
    setSelectedAttributeId(attributeId)

    if (attributeId) {
      const attribute = variantAttributes.find((attr: VariantAttribute) => attr._id === attributeId)
      if (attribute) {
        const newVariants: VariantRow[] = attribute.values.map((value, index) => ({
          id: `${attribute._id}-${value}`,
          attributeName: attribute.name,
          value,
          sku: `SKU-${attribute.name.substring(0, 3).toUpperCase()}-${value.substring(0, 3).toUpperCase()}-${index + 1}`,
          costPrice: 0,
          price: basePrice,
          enabled: true,
        }))
        setVariants(newVariants)
        // Notify parent of change
        if (onChange) {
          onChange(newVariants)
        }
      }
    } else {
      setVariants([])
      if (onChange) {
        onChange([])
      }
    }
  }

  const handleEnableToggle = (id: string) => {
    setVariants(prev => {
      const updated = prev.map(v => (v.id === id ? { ...v, enabled: !v.enabled } : v))
      // Notify parent of change
      if (onChange) {
        onChange(updated)
      }
      return updated
    })
  }

  const handleEditClick = (variant: VariantRow) => {
    setEditingVariant({
      id: variant.id,
      sku: variant.sku,
      costPrice: variant.costPrice,
      price: variant.price,
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingVariant) {
      setVariants(prev => {
        const updated = prev.map(v =>
          v.id === editingVariant.id
            ? {
              ...v,
              sku: editingVariant.sku,
              costPrice: editingVariant.costPrice,
              price: editingVariant.price,
            }
            : v
        )
        // Notify parent of change
        if (onChange) {
          onChange(updated)
        }
        return updated
      })
      setEditModalOpen(false)
      setEditingVariant(null)
      toast.success('Variant updated')
    }
  }

  const handleInlineUpdate = (id: string, field: keyof VariantRow, value: any) => {
    setVariants(prev => {
      const updated = prev.map(v => (v.id === id ? { ...v, [field]: value } : v))
      // Notify parent of change
      if (onChange) {
        onChange(updated)
      }
      return updated
    })
  }

  const handleCreateAttribute = async () => {
    if (!newAttributeName.trim() || !newAttributeValues.trim()) {
      toast.error('Please enter attribute name and values')
      return
    }

    setIsCreating(true)
    try {
      const values = newAttributeValues
        .split(',')
        .map(v => v.trim())
        .filter(v => v)

      if (values.length === 0) {
        toast.error('Please enter at least one value')
        setIsCreating(false)
        return
      }

      await createVariantAttribute.mutateAsync({
        name: newAttributeName.trim(),
        values,
        status: 'active',
      })

      toast.success('Variant attribute created successfully')
      setCreateModalOpen(false)
      setNewAttributeName('')
      setNewAttributeValues('')
      refetch()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create variant attribute')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Variant Attribute Selector */}
      <div className="space-y-2">
        <Label htmlFor="variant-attribute">Variant Attribute *</Label>
        <div className="flex gap-2">
          <Select
            value={selectedAttributeId}
            onValueChange={handleAttributeChange}
            disabled={isLoading}
          >
            <SelectTrigger id="variant-attribute" className="flex-1">
              <SelectValue placeholder={
                isLoading
                  ? "Loading attributes..."
                  : error
                    ? "Error loading attributes"
                    : "Choose variant attribute (e.g., Color, Size)"
              } />
            </SelectTrigger>
            <SelectContent>
              {variantAttributes
                .filter((attr: VariantAttribute) => attr.status === 'active')
                .map((attr: VariantAttribute) => (
                  <SelectItem key={attr._id} value={attr._id}>
                    {attr.name} ({attr.values.length} values)
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => setCreateModalOpen(true)}
            className="shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            Create New
          </Button>
        </div>
      </div>

      {/* Variants Table */}
      {variants.length > 0 && (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="h-9">
                <TableHead className="w-[160px] py-2 text-xs">Variant Value</TableHead>
                <TableHead className="w-[180px] py-2 text-xs">SKU</TableHead>
                <TableHead className="w-[120px] py-2 text-xs">Price</TableHead>
                <TableHead className="w-[140px] py-2 text-xs">Cost Price</TableHead>
                <TableHead className="w-[120px] text-right py-2 text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map(variant => (
                <TableRow
                  key={variant.id}
                  className={`h-10 ${!variant.enabled ? 'opacity-50 bg-gray-50' : ''}`}
                >
                  <TableCell className="font-medium py-1 text-sm">{variant.value}</TableCell>
                  <TableCell className="py-1">
                    <Input
                      value={variant.sku}
                      onChange={e =>
                        handleInlineUpdate(variant.id, 'sku', e.target.value)
                      }
                      className="h-7 text-sm"
                    />
                  </TableCell>
                  <TableCell className="py-1">
                    <Input
                      type="number"
                      value={variant.price}
                      onChange={e =>
                        handleInlineUpdate(
                          variant.id,
                          'price',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </TableCell>
                  <TableCell className="py-1">
                    <Input
                      type="number"
                      value={variant.costPrice || ''}
                      onChange={e =>
                        handleInlineUpdate(
                          variant.id,
                          'costPrice',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-7 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </TableCell>
                  <TableCell className="text-right py-1">
                    <div className="flex items-center justify-end pr-2 gap-2">
                      <Checkbox
                        checked={variant.enabled}
                        onCheckedChange={() => handleEnableToggle(variant.id)}
                        title={variant.enabled ? 'Disable variant' : 'Enable variant'}
                        className="h-6 w-6"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEditClick(variant)}
                        title="More details"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Modal for Additional Information */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Additional Variant Information</DialogTitle>
          </DialogHeader>
          {editingVariant && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sku">SKU</Label>
                <Input
                  id="edit-sku"
                  value={editingVariant.sku}
                  onChange={e =>
                    setEditingVariant({ ...editingVariant, sku: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-costPrice"
                  type="number"
                  value={editingVariant.costPrice}
                  onChange={e =>
                    setEditingVariant({
                      ...editingVariant,
                      costPrice: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editingVariant.price}
                  onChange={e =>
                    setEditingVariant({
                      ...editingVariant,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-barcode">Barcode</Label>
                <Input
                  id="edit-barcode"
                  value={editingVariant.barcode || ''}
                  onChange={e =>
                    setEditingVariant({ ...editingVariant, barcode: e.target.value })
                  }
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-weight">Weight</Label>
                <Input
                  id="edit-weight"
                  value={editingVariant.weight || ''}
                  onChange={e =>
                    setEditingVariant({ ...editingVariant, weight: e.target.value })
                  }
                  placeholder="e.g., 1.5 kg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dimensions">Dimensions</Label>
                <Input
                  id="edit-dimensions"
                  value={editingVariant.dimensions || ''}
                  onChange={e =>
                    setEditingVariant({ ...editingVariant, dimensions: e.target.value })
                  }
                  placeholder="e.g., 10x5x3 cm"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DynamicForm
        id='variant-form'
        className="space-y-6"
        form={variantCreateForm}
        config={variantAttributeFormConfig}
        // Container props
        openInside="modal"
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Create Variant Attribute"
        cancelLabel="Cancel"
        resetAfterSubmit
        // Mutation hook
        mutationHook={createVariantAttribute}
      />
    </div>
  )
}
