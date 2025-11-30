import React, { useState, useEffect } from 'react'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Label } from '@ui/components/label'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
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
import { RadioGroup, RadioGroupItem } from '@ui/components/radio-group'
import DynamicForm from '@/ui/components/form'
import { useDynamicForm } from '@/hooks/use-dynamic-form'
import { toast } from 'sonner'
import { Plus, Minus, Edit, Trash2, Upload, X, Check } from 'lucide-react'
import type { DynamicFormConfig } from '@/ui/components/form/type'

// Mock variant attributes data (replace with actual API)
const mockVariantAttributes = [
  { _id: '1', name: 'Color', values: ['Red', 'Blue', 'Green', 'Black', 'White'] },
  { _id: '2', name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { _id: '3', name: 'Material', values: ['Cotton', 'Leather', 'Synthetic', 'Wool'] },
  { _id: '4', name: 'Pattern', values: ['Solid', 'Striped', 'Printed', 'Embossed'] },
]

interface Variant {
  id: string
  attributes: Record<string, string>
  sku: string
  quantity: number
  price: number
  images?: string[]
  barcode?: string
}

interface VariantManagerProps {
  productType: 'single' | 'variable'
  onProductTypeChange: (type: 'single' | 'variable') => void
  onVariantsChange?: (variants: Variant[]) => void
  defaultVariants?: Variant[]
  basePrice?: number
}

const addVariantFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: 'barcode_symbology',
      type: 'select',
      label: 'Barcode Symbology',
      required: true,
      columnSpan: 6,
      defaultValue: 'CODE128',
      options: [
        { value: 'CODE128', label: 'CODE128' },
        { value: 'EAN13', label: 'EAN13' },
        { value: 'UPC', label: 'UPC' },
        { value: 'QR', label: 'QR Code' }
      ]
    },
    {
      name: 'item_code',
      type: 'input',
      label: 'Item Code',
      required: true,
      columnSpan: 6,
      placeholder: 'Enter item code'
    },
    {
      name: 'images',
      type: 'file-upload',
      label: 'Variant Thumbnail',
      columnSpan: 12,
      accept: 'image/*',
      maxFiles: 5,
      maxSize: 2 * 1024 * 1024, // 2MB
      fileTypes: ['jpg', 'jpeg', 'png'],
      dropzoneText: 'Drag and drop a file to upload'
    },
    {
      name: 'quantity',
      type: 'number',
      label: 'Quantity',
      required: true,
      columnSpan: 6,
      defaultValue: 0,
      validation: {
        min: 0
      }
    },
    {
      name: 'quantity_alert',
      type: 'number',
      label: 'Quantity Alert',
      required: true,
      columnSpan: 6,
      defaultValue: 10,
      validation: {
        min: 0
      }
    },
    {
      name: 'tax_type',
      type: 'select',
      label: 'Tax Type',
      required: true,
      columnSpan: 6,
      options: [
        { value: 'exclusive', label: 'Exclusive' },
        { value: 'inclusive', label: 'Inclusive' },
        { value: 'none', label: 'No Tax' }
      ]
    },
    {
      name: 'tax',
      type: 'select',
      label: 'Tax',
      required: true,
      columnSpan: 6,
      options: [
        { value: 'vat_10', label: 'VAT 10%' },
        { value: 'vat_15', label: 'VAT 15%' },
        { value: 'gst_18', label: 'GST 18%' },
        { value: 'none', label: 'No Tax' }
      ]
    },
    {
      name: 'discount_type',
      type: 'select',
      label: 'Discount Type',
      required: true,
      columnSpan: 6,
      defaultValue: 'fixed',
      options: [
        { value: 'fixed', label: 'Fixed Amount' },
        { value: 'percentage', label: 'Percentage' }
      ]
    },
    {
      name: 'discount_value',
      type: 'number',
      label: 'Discount Value',
      required: true,
      columnSpan: 6,
      defaultValue: 0,
      validation: {
        min: 0
      }
    }
  ]
}

export default function VariantManager({
  productType,
  onProductTypeChange,
  onVariantsChange,
  defaultVariants = [],
  basePrice = 0
}: VariantManagerProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Array<{ name: string; values: string[] }>>([])
  const [variants, setVariants] = useState<Variant[]>(defaultVariants)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null)

  // Form setup for add variant modal
  const { form, config } = useDynamicForm<any>(addVariantFormConfig)

  useEffect(() => {
    if (productType === 'variable' && selectedAttributes.length > 0) {
      generateVariants()
    } else if (productType === 'single') {
      setVariants([])
      setSelectedAttributes([])
    }
  }, [selectedAttributes, productType])

  useEffect(() => {
    onVariantsChange?.(variants)
  }, [variants, onVariantsChange])

  const handleAttributeSelect = (attributeName: string) => {
    const attribute = mockVariantAttributes.find(attr => attr.name === attributeName)
    if (attribute && !selectedAttributes.find(sel => sel.name === attributeName)) {
      setSelectedAttributes([...selectedAttributes, { name: attributeName, values: [] }])
    }
  }

  const handleAttributeValueChange = (attributeName: string, values: string[]) => {
    setSelectedAttributes(prev =>
      prev.map(attr =>
        attr.name === attributeName ? { ...attr, values } : attr
      )
    )
  }

  const removeAttribute = (attributeName: string) => {
    setSelectedAttributes(prev => prev.filter(attr => attr.name !== attributeName))
  }

  const generateVariants = () => {
    if (selectedAttributes.length === 0 || selectedAttributes.some(attr => attr.values.length === 0)) {
      setVariants([])
      return
    }

    const combinations = generateCombinations(selectedAttributes.map(attr => ({
      name: attr.name,
      values: attr.values
    })))

    const newVariants: Variant[] = combinations.map((combination, index) => {
      // Check if variant already exists
      const existingVariant = variants.find(v => 
        JSON.stringify(v.attributes) === JSON.stringify(combination)
      )

      if (existingVariant) {
        return existingVariant
      }

      // Generate SKU from combination
      const sku = Object.values(combination).join('-').toLowerCase().replace(/\s+/g, '-')
      
      return {
        id: `variant-${Date.now()}-${index}`,
        attributes: combination,
        sku: sku,
        quantity: 0,
        price: basePrice,
        images: []
      }
    })

    setVariants(newVariants)
  }

  const generateCombinations = (attributes: Array<{ name: string; values: string[] }>): Record<string, string>[] => {
    if (attributes.length === 0) return []
    if (attributes.length === 1) {
      return attributes[0].values.map(value => ({ [attributes[0].name]: value }))
    }

    const [first, ...rest] = attributes
    const restCombinations = generateCombinations(rest)
    
    const result: Record<string, string>[] = []
    for (const value of first.values) {
      for (const combination of restCombinations) {
        result.push({ [first.name]: value, ...combination })
      }
    }
    
    return result
  }

  const updateVariantField = (variantId: string, field: string, value: any) => {
    setVariants(prev =>
      prev.map(variant =>
        variant.id === variantId ? { ...variant, [field]: value } : variant
      )
    )
  }

  const removeVariant = (variantId: string) => {
    setVariants(prev => prev.filter(v => v.id !== variantId))
  }

  const addNewVariant = (variantData: any) => {
    // Create attributes object from selected attributes
    const attributes: Record<string, string> = {}
    selectedAttributes.forEach(attr => {
      if (attr.values.length > 0) {
        attributes[attr.name] = attr.values[0] // Default to first value
      }
    })

    const newVariant: Variant = {
      id: `variant-${Date.now()}`,
      attributes,
      sku: Object.values(attributes).join('-').toLowerCase().replace(/\s+/g, '-'),
      quantity: variantData.quantity || 0,
      price: basePrice,
      images: variantData.images || [],
      barcode: variantData.item_code
    }

    setVariants(prev => [...prev, newVariant])
    setIsAddModalOpen(false)
  }

  const handleEditVariant = (variant: Variant) => {
    setEditingVariant(variant)
    form.reset({
      barcode_symbology: 'CODE128',
      item_code: variant.barcode || '',
      images: variant.images || [],
      quantity: variant.quantity,
      quantity_alert: 10,
      tax_type: 'exclusive',
      tax: 'none',
      discount_type: 'fixed',
      discount_value: 0
    })
    setIsAddModalOpen(true)
  }

  const generateItemCode = () => {
    const code = `ITEM-${Date.now().toString().slice(-8)}`
    form.setValue('item_code', code)
    toast.success('Item code generated')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-orange-500">💰</span>
          Pricing & Stocks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Type Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Product Type <span className="text-red-500">*</span>
          </Label>
          <RadioGroup
            value={productType}
            onValueChange={(value: 'single' | 'variable') => onProductTypeChange(value)}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single" className="cursor-pointer">Single Product</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="variable" id="variable" />
              <Label htmlFor="variable" className="cursor-pointer">Variable Product</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Variable Product Configuration */}
        {productType === 'variable' && (
          <div className="space-y-4">
            {/* Variant Attribute Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Variant Attribute <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {selectedAttributes.length === 0 ? (
                <Select onValueChange={handleAttributeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockVariantAttributes.map((attr) => (
                      <SelectItem key={attr._id} value={attr.name}>
                        {attr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-3">
                  {selectedAttributes.map((selectedAttr) => {
                    const fullAttribute = mockVariantAttributes.find(attr => attr.name === selectedAttr.name)
                    return (
                      <div key={selectedAttr.name} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="font-medium">{selectedAttr.name}</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttribute(selectedAttr.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {fullAttribute?.values.map((value) => (
                            <Button
                              key={value}
                              type="button"
                              variant={selectedAttr.values.includes(value) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const newValues = selectedAttr.values.includes(value)
                                  ? selectedAttr.values.filter(v => v !== value)
                                  : [...selectedAttr.values, value]
                                handleAttributeValueChange(selectedAttr.name, newValues)
                              }}
                            >
                              {value}
                              {selectedAttr.values.includes(value) && (
                                <X className="h-3 w-3 ml-1" />
                              )}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Add another attribute */}
                  <Select onValueChange={handleAttributeSelect}>
                    <SelectTrigger className="border-dashed">
                      <SelectValue placeholder="Add another attribute" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockVariantAttributes
                        .filter(attr => !selectedAttributes.find(sel => sel.name === attr.name))
                        .map((attr) => (
                          <SelectItem key={attr._id} value={attr.name}>
                            {attr.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Variants Table */}
            {variants.length > 0 && (
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variation</TableHead>
                        <TableHead>Variant Value</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell className="font-medium">
                            {Object.keys(variant.attributes)[0] || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {Object.values(variant.attributes).join(', ')}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={variant.sku}
                              onChange={(e) => updateVariantField(variant.id, 'sku', e.target.value)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateVariantField(variant.id, 'quantity', Math.max(0, variant.quantity - 1))}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                value={variant.quantity}
                                onChange={(e) => updateVariantField(variant.id, 'quantity', parseInt(e.target.value) || 0)}
                                className="w-16 text-center"
                                min="0"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => updateVariantField(variant.id, 'quantity', variant.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={variant.price}
                              onChange={(e) => updateVariantField(variant.id, 'price', parseFloat(e.target.value) || 0)}
                              className="w-24"
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="text-orange-500 hover:text-orange-600"
                                onClick={() => handleEditVariant(variant)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {}}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeVariant(variant.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Variant Modal */}
        <DynamicForm
          config={config}
          form={form}
          onSubmit={(data) => {
            addNewVariant(data)
            return data
          }}
          
          openInside="modal"
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          title="Add Variant"
          submitLabel="Add Variant"
          modalSize="lg"
          
          onSuccess={() => {
            toast.success('Variant added successfully')
            form.reset()
          }}
          onFailed={() => {
            toast.error('Failed to add variant')
          }}
        />
      </CardContent>
    </Card>
  )
}