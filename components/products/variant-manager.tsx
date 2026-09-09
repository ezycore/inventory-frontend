'use client'
// coding-standard: maintained

import { selectOptions } from "@/services/api/select-options";
import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useWatch } from 'react-hook-form'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { NumberField } from '@ui/components/number-field'
import { DatePicker } from '@ui/components/date-picker'
import { Label } from '@ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/select'
import { SimpleTable, type SimpleColumn } from '@ui/components/simple-table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@ui/components/dialog'
import { Checkbox } from '@ui/components/checkbox'
import { toast } from 'sonner'
import { Plus, PlusCircle, Upload, ImageIcon } from 'lucide-react'
import { useVariantAttributes, useCreateVariantAttribute, useSelectOptions } from '@/services/api'
import { useAuthStore } from '@/services/stores'
import { isFeatureEnabled } from '@/lib/feature-utils'
import {
  GalleryItemRow,
  describeGalleryEntry,
} from '@/components/shared/gallery-item-row'
import {
  moveGalleryEntry,
  replaceGalleryEntry,
} from '@/lib/image-gallery-order'
import type { VariantAttribute } from '@/types'
import DynamicForm from '@/ui/components/form'
import getVariantAttributeFormConfig from '../variants/form-config'
import useDynamicForm from '@/hooks/use-dynamic-form'
import {
  FileUpload,
  FileUploadDropzone,
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
  barcode?: string
  inventoryAlertLevel?: number
  // Per-variant opening stock (create-only; shown when addToInventory is on)
  openingStock?: number
  costPrice?: number
  expiryDate?: string
  batchNumber?: string
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
  barcode?: string
  // Inventory (shown in modal when addToInventory is on); openingStock gates expiry/batch
  openingStock?: number
  costPrice?: number
  inventoryAlertLevel?: number
  expiryDate?: string
  batchNumber?: string
}

export default function VariantManager({
  control,
  value = [],
  onChange,
}: VariantManagerProps) {
  const t = useTranslations('products.products.variantManager')
  const tVariants = useTranslations('products.variants')
  const [selectedAttributeId, setSelectedAttributeId] = useState<string>('')
  const [variants, setVariants] = useState<VariantRow[]>(value)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<EditModalData | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Watch the price field from parent form using useWatch
  const basePrice = useWatch({ control, name: 'price' }) || 0
  const baseUnitId = useWatch({ control, name: 'unitId' })
  const addToInventory = useWatch({ control, name: 'addToInventory' })
  const hasExpiry = useWatch({ control, name: 'hasExpiry' })

  // Feature gates — mirror the product form (hooks/use-filters.ts): a variant
  // must not expose barcode / UOM fields the org's plan doesn't include.
  const orgFeatures = useAuthStore((state) => state.user?.organization?.features)
  const barcodeEnabled = isFeatureEnabled(orgFeatures, 'barcodeSystem')
  const uomEnabled = isFeatureEnabled(orgFeatures, 'uomConversion')

  // Fetch variant attributes from API
  const { data: attributesResponse, isLoading, error } = useVariantAttributes()
  const variantAttributes = attributesResponse?.data?.items || []
  const createVariantAttribute = useCreateVariantAttribute()

  // Unit options for UOM selectors
  const { data: unitOptions = [] } = useSelectOptions(selectOptions("units", { fields: "_id,name,shortName" }))
  const baseUnit = unitOptions.find(
    (opt: any) => opt.value === baseUnitId || (opt as any)._id === baseUnitId,
  )

  const baseUnitLabel: string | undefined = (baseUnit as { shortName?: string })?.shortName 

  const variantAttributeFormConfig = getVariantAttributeFormConfig(tVariants)
  const {form: variantCreateForm} = useDynamicForm(variantAttributeFormConfig)
  
  // Hydrate internal state from the form value (edit mode loads it after mount).
  // Adjusted during render rather than in an effect — an effect would commit an
  // empty table first and re-render, and setState in an effect cascades renders.
  if (value.length > 0 && variants.length === 0) {
    setVariants(value)
  }

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
          inventoryAlertLevel: 0,
          openingStock: 0,
          costPrice: 0,
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
      barcode: variant.barcode || '',
      openingStock: variant.openingStock ?? 0,
      costPrice: variant.costPrice ?? 0,
      inventoryAlertLevel: variant.inventoryAlertLevel ?? 0,
      expiryDate: variant.expiryDate || '',
      batchNumber: variant.batchNumber || '',
    })
    setEditModalOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingVariant) return

    if (editingVariant.enableUOMConversion) {
      const { purchaseUnit, saleUnit } = editingVariant
      const hasAny = !!purchaseUnit?.unitId || !!saleUnit?.unitId
      if (!hasAny) {
        toast.error(t('toasts.selectUnit'))
        return
      }
      if (purchaseUnit?.unitId && (!purchaseUnit.conversionFactor || purchaseUnit.conversionFactor <= 0)) {
        toast.error(t('toasts.purchaseFactorRequired'))
        return
      }
      if (saleUnit?.unitId && (!saleUnit.conversionFactor || saleUnit.conversionFactor <= 0)) {
        toast.error(t('toasts.saleFactorRequired'))
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
            barcode: editingVariant.barcode?.trim() || undefined,
            openingStock: editingVariant.openingStock ?? 0,
            costPrice: editingVariant.costPrice ?? 0,
            inventoryAlertLevel: editingVariant.inventoryAlertLevel ?? 0,
            expiryDate: editingVariant.expiryDate || undefined,
            batchNumber: editingVariant.batchNumber?.trim() || undefined,
          }
          : v
      )
      if (onChange) onChange(updated)
      return updated
    })
    setEditModalOpen(false)
    setEditingVariant(null)
    toast.success(t('toasts.variantUpdated'))
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

  const variantColumns: SimpleColumn<VariantRow>[] = [
    {
      key: 'image',
      header: '',
      headClassName: 'w-[50px] py-2 text-xs',
      cellClassName: 'py-1',
      cell: (variant) =>
        variant.images && variant.images.length > 0 ? (
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
        ),
    },
    {
      key: 'value',
      header: t('valueColumn'),
      headClassName: 'w-[160px] py-2 text-xs',
      cellClassName: 'font-medium py-1 text-sm',
      cell: (variant) => variant.value,
    },
    {
      key: 'price',
      header: (
        <>
          {t('priceColumn')}{baseUnitLabel ? <span className="text-muted-foreground font-normal"> / {baseUnitLabel}</span> : null}
        </>
      ),
      headClassName: 'w-[180px] py-2 text-xs',
      cellClassName: 'py-1',
      cell: (variant) => (
        <div className="relative">
          <NumberField
            precision={2}
            value={variant.price}
            step={1}
            min={0}
            onChange={v => handleInlineUpdate(variant.id, 'price', v ?? '')}
            className="h-7 text-sm pr-12"
          />
          {baseUnitLabel ? (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              /{baseUnitLabel}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'active',
      align: 'right',
      headClassName: 'w-[120px] py-2 text-xs',
      cellClassName: 'py-1',
      header: (
        <div className="flex items-center justify-end pr-2 gap-1">
          <span>{t('activeColumn')}</span>
          <Checkbox
            checked={
              variants.every(v => v.enabled)
                ? true
                : variants.some(v => v.enabled)
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={handleToggleAll}
            title={variants.every(v => v.enabled) ? t('deselectAll') : t('selectAll')}
            className="h-4 w-4"
          />
        </div>
      ),
      cell: (variant) => (
        <div className="flex items-center justify-end pr-2 gap-2">
          <Checkbox
            checked={variant.enabled}
            onCheckedChange={() => handleEnableToggle(variant.id)}
            title={variant.enabled ? t('disableVariant') : t('enableVariant')}
            className="h-6 w-6"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => handleEditClick(variant)}
            title={t('moreDetails')}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Variant Attribute Selector */}
      <div className="space-y-2">
        <Label htmlFor="variant-attribute">{t('attributeLabel')}</Label>
        <div className="flex gap-2">
          <Select
            value={selectedAttributeId}
            onValueChange={handleAttributeChange}
            disabled={isLoading}
          >
            <SelectTrigger id="variant-attribute" className="flex-1">
              <SelectValue placeholder={
                isLoading
                  ? t('loadingAttributes')
                  : error
                    ? t('errorLoadingAttributes')
                    : t('choosePlaceholder')
              } />
            </SelectTrigger>
            <SelectContent>
              {variantAttributes
                .filter((attr: VariantAttribute) => attr.status === 'active')
                .map((attr: VariantAttribute) => (
                  <SelectItem key={attr._id} value={attr._id}>
                    {attr.name} ({t('valuesCount', { count: attr.values.length })})
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
            {t('createNew')}
          </Button>
        </div>
      </div>

      {/* Variants Table */}
      {variants.length > 0 && (
        <div className="border rounded-lg">
          <SimpleTable
            columns={variantColumns}
            rows={variants}
            getRowKey={(variant) => variant.id}
            headerRowClassName="h-9"
            rowClassName={(variant) => `h-10 ${!variant.enabled ? 'opacity-50' : ''}`}
          />
        </div>
      )}

      {/* Edit Modal for Additional Information */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('modalTitle')}</DialogTitle>
          </DialogHeader>
          {editingVariant && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price">
                  {t('priceLabel')}{baseUnitLabel ? <span className="text-muted-foreground font-normal"> / {baseUnitLabel}</span> : null}
                </Label>
                <NumberField
                  id="edit-price"
                  precision={2}
                  step={1}
                  min={0}
                  value={editingVariant.price}
                  onChange={v =>
                    setEditingVariant({ ...editingVariant, price: v ?? 0 })
                  }
                />
              </div>

              {/* Barcode VALUE (per variant). The barcode TYPE (symbology) is set
                  once on the product form and shared by every variant. Gated by
                  `barcodeSystem` to match the product form (hooks/use-filters.ts). */}
              {barcodeEnabled && (
                <div className="grid grid-cols-2 gap-3 border-t pt-4">
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="edit-barcode" className="text-xs">{t('barcodeLabel')}</Label>
                    <Input
                      id="edit-barcode"
                      value={editingVariant.barcode || ''}
                      placeholder={t('barcodePlaceholder')}
                      onChange={e =>
                        setEditingVariant({ ...editingVariant, barcode: e.target.value })
                      }
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {t('barcodeHint')}
                    </p>
                  </div>
                </div>
              )}

              {/* Inventory (per variant) — only when Track stock is on */}
              {addToInventory && (
                <div className="grid grid-cols-2 gap-3 border-t pt-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-opening-stock" className="text-xs">{t('openingStockLabel')}</Label>
                    <NumberField
                      id="edit-opening-stock"
                      min={0}
                      value={editingVariant.openingStock ?? 0}
                      onChange={v =>
                        setEditingVariant({ ...editingVariant, openingStock: v ?? 0 })
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-cost-price" className="text-xs">{t('costPriceLabel')}</Label>
                    <NumberField
                      id="edit-cost-price"
                      precision={2}
                      min={0}
                      value={editingVariant.costPrice ?? 0}
                      onChange={v =>
                        setEditingVariant({ ...editingVariant, costPrice: v ?? 0 })
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="edit-alert-level" className="text-xs">{t('alertLevelLabel')}</Label>
                    <NumberField
                      id="edit-alert-level"
                      precision={0}
                      min={0}
                      value={editingVariant.inventoryAlertLevel ?? 0}
                      onChange={v =>
                        setEditingVariant({ ...editingVariant, inventoryAlertLevel: v ?? 0 })
                      }
                      placeholder={t('alertLevelPlaceholder')}
                    />
                  </div>
                </div>
              )}

              {/* Opening-stock expiry batch (per variant) — only when expiry is
                  tracked and this variant has opening stock */}
              {addToInventory && hasExpiry && (editingVariant.openingStock ?? 0) > 0 && (
                <div className="grid grid-cols-2 gap-3 border-t pt-4">
                  <div className="space-y-1">
                    <Label htmlFor="edit-expiry" className="text-xs">{t('expiryDateLabel')}</Label>
                    <DatePicker
                      date={editingVariant.expiryDate || undefined}
                      onSelect={d =>
                        setEditingVariant({ ...editingVariant, expiryDate: d ?? '' })
                      }
                      placeholder={t('expiryDatePlaceholder')}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="edit-batch" className="text-xs">{t('batchNumberLabel')}</Label>
                    <Input
                      id="edit-batch"
                      value={editingVariant.batchNumber || ''}
                      placeholder={t('batchNumberPlaceholder')}
                      onChange={e =>
                        setEditingVariant({ ...editingVariant, batchNumber: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              {/* UOM Conversion (per variant) — gated by `uomConversion` to match
                  the product form (hooks/use-filters.ts). */}
              {uomEnabled && (
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
                      {t('enableUomLabel')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('enableUomHint')}
                    </p>
                  </div>
                </div>

                {editingVariant.enableUOMConversion && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('purchaseUnitLabel')}</Label>
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
                          <SelectValue placeholder={t('purchaseUnitPlaceholder')} />
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
                      <Label className="text-xs">{t('purchaseFactorLabel')}</Label>
                      <NumberField
                        step={1}
                        min={1}
                        value={editingVariant.purchaseUnit?.conversionFactor ?? null}
                        onChange={v =>
                          setEditingVariant({
                            ...editingVariant,
                            purchaseUnit: {
                              ...editingVariant.purchaseUnit,
                              conversionFactor: v ?? undefined,
                            },
                          })
                        }
                        className="h-9"
                      />
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Variant Image Upload */}
              <div className="space-y-2 border-t pt-4">
                <Label>{t('imagesLabel')}</Label>
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
                          <span className="font-semibold text-primary">{t('clickToUpload')}</span>
                          <span className="text-muted-foreground">{t('orDragDrop')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {t('uploadHint')}
                        </p>
                      </div>
                    </FileUploadDropzone>
                  )}

                  {editingVariant.images && editingVariant.images.length > 0 && (
                    <FileUploadList className="mt-3">
                      {editingVariant.images.map((file: any, index: number) => {
                        if (
                          !(file instanceof File) &&
                          !(file && typeof file === 'object' && file.publicId)
                        ) {
                          return null
                        }
                        const { key, fileName, fileSize, previewUrl } =
                          describeGalleryEntry(file, index, {
                            existingImage: t('existingImage'),
                            uploaded: t('uploaded'),
                          })
                        const images = (editingVariant.images || []) as any[]
                        return (
                          <GalleryItemRow
                            key={key}
                            value={file}
                            previewUrl={previewUrl}
                            fileName={fileName}
                            fileSize={fileSize}
                            index={index}
                            count={images.length}
                            compact
                            // A variant gallery is ordered for the same reason
                            // the product one is: image 0 is the variant's
                            // display picture on the storefront.
                            showOrdering
                            onMove={(from, to) =>
                              setEditingVariant({
                                ...editingVariant,
                                images: moveGalleryEntry(images, from, to),
                              })
                            }
                            onReplace={(at, replacement) =>
                              setEditingVariant({
                                ...editingVariant,
                                images: replaceGalleryEntry(images, at, replacement),
                              })
                            }
                            accept="image/*"
                            maxSize={5 * 1024 * 1024}
                          />
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
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveEdit}>{t('saveChanges')}</Button>
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
        title={t('createModalTitle')}
        cancelLabel={t('cancel')}
        resetAfterSubmit
        // Mutation hook
        mutationHook={createVariantAttribute}
      />
    </div>
  )
}
