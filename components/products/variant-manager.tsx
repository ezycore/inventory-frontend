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
import { Plus, PlusCircle, Upload, X, ImageIcon } from 'lucide-react'
import { useVariantAttributes, useCreateVariantAttribute, useSelectOptions } from '@/services/api'
import type { VariantAttribute } from '@/types'
import DynamicForm from '@/ui/components/form'
import variantAttributeFormConfig from '../variants/form-config'
import useDynamicForm from '@/hooks/use-dynamic-form'
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemPreview,
  FileUploadList,
} from '@ui/components/file-upload'
import { SafeImage } from '@/ui/components/safeImage'

type VariantImage = File | { url: string; thumbnailUrl?: string; mediumUrl?: string; publicId: string }

interface UnitConversion {
  unitId?: string
  conversionFactor?: number
}

interface VariantRow {
  id: string
  _id?: string // MongoDB _id for smart merge on update
  attributeName: string
  value: string
  price: number
  enabled: boolean
  images?: VariantImage[]
  enableUOMConversion?: boolean
  purchaseUnit?: UnitConversion
  saleUnit?: UnitConversion
}

interface VariantManagerProps {
  control: any // React Hook Form control
  value?: VariantRow[] // Current value from form
  onChange?: (variants: VariantRow[]) => void // Callback to pass data back to form
}

interface EditModalData {
  id: string
  price: number
  images?: VariantImage[]
  enableUOMConversion: boolean
  purchaseUnit: UnitConversion
  saleUnit: UnitConversion
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
  const baseUnitId = useWatch({ control, name: 'unitId' })

  // Fetch variant attributes from API
  const { data: attributesResponse, isLoading, error, refetch } = useVariantAttributes()
  const variantAttributes = attributesResponse?.data?.items || []
  const createVariantAttribute = useCreateVariantAttribute()

  // Unit options for UOM selectors
  const { data: unitOptions = [] } = useSelectOptions('/units?all=true&fields=_id,name,shortName')
  const baseUnit = unitOptions.find(
    (opt: any) => opt.value === baseUnitId || (opt as any)._id === baseUnitId,
  )

  const baseUnitLabel: string | undefined = (baseUnit as { shortName?: string })?.shortName 

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
        const newVariants: VariantRow[] = attribute.values.map((value) => ({
          id: `${attribute._id}-${value}`,
          attributeName: attribute.name,
          value,
          price: basePrice,
          enabled: true,
          enableUOMConversion: false,
          saleUnit: { unitId: baseUnitId, conversionFactor: 1 },
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

  const handleToggleAll = () => {
    const allEnabled = variants.every(v => v.enabled)
    setVariants(prev => {
      const updated = prev.map(v => ({ ...v, enabled: !allEnabled }))
      if (onChange) onChange(updated)
      return updated
    })
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
      price: variant.price,
      images: variant.images || [],
      enableUOMConversion: variant.enableUOMConversion ?? false,
      purchaseUnit: variant.purchaseUnit ?? {},
      saleUnit: variant.saleUnit ?? { unitId: baseUnitId, conversionFactor: 1 },
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingVariant) return

    if (editingVariant.enableUOMConversion) {
      const { purchaseUnit, saleUnit } = editingVariant
      const hasAny = !!purchaseUnit?.unitId || !!saleUnit?.unitId
      if (!hasAny) {
        toast.error('Select at least one unit (purchase or sale) for UOM conversion')
        return
      }
      if (purchaseUnit?.unitId && (!purchaseUnit.conversionFactor || purchaseUnit.conversionFactor <= 0)) {
        toast.error('Purchase conversion factor is required')
        return
      }
      if (saleUnit?.unitId && (!saleUnit.conversionFactor || saleUnit.conversionFactor <= 0)) {
        toast.error('Sale conversion factor is required')
        return
      }
    }

    setVariants(prev => {
      const updated = prev.map(v =>
        v.id === editingVariant.id
          ? {
            ...v,
            price: editingVariant.price,
            images: editingVariant.images || [],
            enableUOMConversion: editingVariant.enableUOMConversion,
            purchaseUnit: editingVariant.enableUOMConversion ? editingVariant.purchaseUnit : undefined,
            saleUnit: editingVariant.enableUOMConversion ? editingVariant.saleUnit : undefined,
          }
          : v
      )
      if (onChange) onChange(updated)
      return updated
    })
    setEditModalOpen(false)
    setEditingVariant(null)
    toast.success('Variant updated')
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
                <TableHead className="w-[50px] py-2 text-xs"></TableHead>
                <TableHead className="w-[160px] py-2 text-xs">Variant Value</TableHead>
                <TableHead className="w-[180px] py-2 text-xs">
                  Price{baseUnitLabel ? <span className="text-muted-foreground font-normal"> / {baseUnitLabel}</span> : null}
                </TableHead>
                <TableHead className="w-[120px] text-right py-2 text-xs">
                  <div className="flex items-center justify-end pr-2 gap-1">
                    <span>Active</span>
                    <Checkbox
                      checked={
                        variants.every(v => v.enabled)
                          ? true
                          : variants.some(v => v.enabled)
                            ? 'indeterminate'
                            : false
                      }
                      onCheckedChange={handleToggleAll}
                      title={variants.every(v => v.enabled) ? 'Deselect all' : 'Select all'}
                      className="h-4 w-4"
                    />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map(variant => (
                <TableRow
                  key={variant.id}
                  className={`h-10 ${!variant.enabled ? 'opacity-50 bg-gray-50' : ''}`}
                >
                  <TableCell className="py-1">
                    {variant.images && variant.images.length > 0 ? (
                      (() => {
                        const firstImg = variant.images[0]
                        const src = firstImg instanceof File
                          ? URL.createObjectURL(firstImg)
                          : (firstImg as any).thumbnailUrl || (firstImg as any).url
                        return (
                          <div className="w-8 h-8 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                            <SafeImage src={src} alt={variant.value} className="w-full h-full object-cover" />
                          </div>
                        )
                      })()
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium py-1 text-sm">{variant.value}</TableCell>
                  <TableCell className="py-1">
                    <div className="relative">
                      <Input
                        type="number"
                        value={variant.price}
                        onChange={e =>
                          handleInlineUpdate(
                            variant.id,
                            'price',
                            parseFloat(e.target.value) || ''
                          )
                        }
                        className="h-7 text-sm pr-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      {baseUnitLabel ? (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                          /{baseUnitLabel}
                        </span>
                      ) : null}
                    </div>
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Variant Details</DialogTitle>
          </DialogHeader>
          {editingVariant && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">
                  Price{baseUnitLabel ? <span className="text-muted-foreground font-normal"> / {baseUnitLabel}</span> : null}
                </Label>
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

              {/* UOM Conversion (per variant) */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="edit-enable-uom"
                    checked={editingVariant.enableUOMConversion}
                    onCheckedChange={(checked) =>
                      setEditingVariant({
                        ...editingVariant,
                        enableUOMConversion: !!checked,
                      })
                    }
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor="edit-enable-uom" className="cursor-pointer">
                      Enable UOM Conversion
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow different units for purchase and sale for this variant
                    </p>
                  </div>
                </div>

                {editingVariant.enableUOMConversion && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Purchase Unit</Label>
                      <Select
                        value={editingVariant.purchaseUnit?.unitId || ''}
                        onValueChange={(val) =>
                          setEditingVariant({
                            ...editingVariant,
                            purchaseUnit: { ...editingVariant.purchaseUnit, unitId: val, conversionFactor: editingVariant.purchaseUnit?.conversionFactor ?? 1 },
                          })
                        }
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOptions.map((opt: any) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Purchase Conversion Factor</Label>
                      <Input
                        type="number"
                        step={0.01}
                        min={0.0001}
                        value={editingVariant.purchaseUnit?.conversionFactor ?? ''}
                        onChange={e =>
                          setEditingVariant({
                            ...editingVariant,
                            purchaseUnit: {
                              ...editingVariant.purchaseUnit,
                              conversionFactor: parseFloat(e.target.value) || undefined,
                            },
                          })
                        }
                        className="h-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    {/* <div className="space-y-1">
                      <Label className="text-xs">Sale Unit</Label>
                      <Select
                        value={editingVariant.saleUnit?.unitId || ''}
                        onValueChange={(val) =>
                          setEditingVariant({
                            ...editingVariant,
                            saleUnit: { ...editingVariant.saleUnit, unitId: val, conversionFactor: editingVariant.saleUnit?.conversionFactor ?? 1 },
                          })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOptions.map((opt: any) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sale Conversion Factor</Label>
                      <Input
                        type="number"
                        step={0.01}
                        min={0.0001}
                        value={editingVariant.saleUnit?.conversionFactor ?? ''}
                        onChange={e =>
                          setEditingVariant({
                            ...editingVariant,
                            saleUnit: {
                              ...editingVariant.saleUnit,
                              conversionFactor: parseFloat(e.target.value) || undefined,
                            },
                          })
                        }
                        className="h-9"
                      />
                    </div> */}
                  </div>
                )}
              </div>

              {/* Variant Image Upload */}
              <div className="space-y-2 border-t pt-4">
                <Label>Variant Images</Label>
                <FileUpload
                  value={(editingVariant.images || []) as (File | string)[]}
                  onValueChange={(files) =>
                    setEditingVariant({ ...editingVariant, images: files as any[] })
                  }
                  accept="image/*"
                  maxFiles={3}
                  maxSize={5 * 1024 * 1024}
                >
                  {(!editingVariant.images || editingVariant.images.length < 3) && (
                    <FileUploadDropzone className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <div className="text-sm">
                          <span className="font-semibold text-primary">Click to upload</span>
                          <span className="text-muted-foreground"> or drag and drop</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, GIF up to 5MB (Max 3 images)
                        </p>
                      </div>
                    </FileUploadDropzone>
                  )}

                  {editingVariant.images && editingVariant.images.length > 0 && (
                    <FileUploadList className="mt-3">
                      {editingVariant.images.map((file: any, index: number) => {
                        let fileKey: string
                        let fileName: string
                        let fileSize: string
                        let previewUrl: string | null = null

                        if (file instanceof File) {
                          fileKey = `${file.name}-${index}`
                          fileName = file.name
                          fileSize = `${(file.size / 1024 / 1024).toFixed(2)} MB`
                          previewUrl = URL.createObjectURL(file)
                        } else if (file && typeof file === 'object' && file.publicId) {
                          fileKey = `${file.publicId}-${index}`
                          fileName = file.publicId?.split('/').pop() || 'Existing image'
                          fileSize = 'Uploaded'
                          previewUrl = file.thumbnailUrl || file.url
                        } else {
                          return null
                        }

                        return (
                          <FileUploadItem
                            key={fileKey}
                            value={file}
                            className="flex items-center gap-3 p-2 border rounded-lg"
                          >
                            {previewUrl ? (
                              <SafeImage
                                src={previewUrl}
                                alt={fileName}
                                className="h-12 w-12 rounded object-cover bg-gray-100"
                              />
                            ) : (
                              <FileUploadItemPreview className="h-12 w-12 rounded overflow-hidden bg-gray-100" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{fileName}</p>
                              <p className="text-xs text-muted-foreground">{fileSize}</p>
                            </div>
                            <FileUploadItemDelete asChild>
                              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <X className="h-4 w-4" />
                              </Button>
                            </FileUploadItemDelete>
                          </FileUploadItem>
                        )
                      })}
                    </FileUploadList>
                  )}
                </FileUpload>
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
