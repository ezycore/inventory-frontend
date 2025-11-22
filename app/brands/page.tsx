'use client'

import { useState } from 'react'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Skeleton } from '@ui/components/skeleton'

import { 
  useBrands, 
  useCreateBrand, 
  useUpdateBrand, 
  useDeleteBrand 
} from '@/hooks/queries'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys-products'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2, Star, AlertTriangle, ExternalLink } from 'lucide-react'
import type { Brand, CreateBrandDto } from '@/types/products'
import { DynamicForm } from '@ui/components/form'
import { useDynamicForm } from '@/hooks/use-dynamic-form'

import type { DynamicFormConfig } from '@/types/form'

export const brandFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: 'name',
      type: 'input',
      label: 'Brand Name',
      placeholder: 'Enter brand name',
      required: true,
      columnSpan: 12,
      validation: {
        minLength: 2,
        maxLength: 100
      }
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Enter brand description',
      rows: 3,
      columnSpan: 12,
      validation: {
        maxLength: 500
      }
    },
    {
      name: 'logo_url',
      type: 'input',
      label: 'Logo URL',
      placeholder: 'https://example.com/logo.png',
      columnSpan: 12,
      validation: {
        url: true
      }
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      columnSpan: 12,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ]
}
export default function BrandsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  
  // Form setup
  const defaultValues = editingBrand || { 
    name: '',
    description: '',
    logo_url: '',
    status: 'active' as const
  }
  const { form } = useDynamicForm(brandFormConfig, defaultValues)

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Queries
  const { data: brands, isLoading, error } = useBrands()
  const createBrand = useCreateBrand()
  const updateBrand = useUpdateBrand()
  const deleteBrand = useDeleteBrand()

  // Filter brands based on search
  const filteredBrands = ((brands as any)?.data?.items || []).filter((brand: any) => 
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleAddBrand = () => {
    setEditingBrand(null)
    // Reset form to default values
    form.reset({
      name: '',
      description: '',
      logo_url: '',
      status: 'active'
    })
    setIsAddModalOpen(true)
  }

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand)
    // Reset form with brand data
    form.reset({
      name: brand.name,
      description: brand.description || '',
      logo_url: brand.logo_url || '',
      status: brand.status
    })
    setIsAddModalOpen(true)
  }

  const handleDeleteBrand = async (brand: Brand) => {
    if (window.confirm(`Are you sure you want to delete "${brand.name}"?`)) {
      try {
        await deleteBrand.mutateAsync(brand._id)
        toast.success('Brand deleted successfully')
      } catch (error) {
        toast.error('Failed to delete brand')
      }
    }
  }

  const onSubmit = async (data: any) => {
    try {
      const dataWithSlug = {
        ...data,
        slug: generateSlug(data.name)
      }
      
      if (editingBrand) {
        await updateBrand.mutateAsync({ id: editingBrand._id, ...dataWithSlug })
        toast.success('Brand updated successfully')
      } else {
        await createBrand.mutateAsync(dataWithSlug)
        toast.success('Brand created successfully')
      }
      setIsAddModalOpen(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all() })
    } catch (error) {
      toast.error(`Failed to ${editingBrand ? 'update' : 'create'} brand`)
    }
  }

  const isSubmitting = createBrand.isPending || updateBrand.isPending

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error loading brands</h3>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Brands</h1>
          <p className="text-muted-foreground">
            Manage product brands and manufacturers
          </p>
        </div>
        <Button onClick={handleAddBrand}>
          <Plus className="h-4 w-4 mr-2" />
          Add Brand
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Brands List */}
      <Card>
        <CardHeader>
          <CardTitle>All Brands</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${filteredBrands.length} brands found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No brands found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first brand'}
              </p>
              <Button onClick={handleAddBrand}>
                <Plus className="h-4 w-4 mr-2" />
                Add Brand
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBrands.map((brand: any) => (
                <div key={brand._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                      {brand.logo_url ? (
                        <img 
                          src={brand.logo_url} 
                          alt={brand.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                            if (nextElement) nextElement.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <Star className="h-6 w-6 text-gray-400" style={{ display: brand.logo_url ? 'none' : 'block' }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{brand.name}</h3>
                        <Badge variant={brand.status === 'active' ? 'default' : 'secondary'}>
                          {brand.status}
                        </Badge>
                        {brand.logo_url && (
                          <a 
                            href={brand.logo_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {brand.description && (
                        <p className="text-sm text-muted-foreground">{brand.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Created: {new Date(brand.created_at).toLocaleDateString()}</span>
                        {brand.updated_at && (
                          <span>Updated: {new Date(brand.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBrand(brand)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBrand(brand)}
                      disabled={deleteBrand.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Brand Modal */}
      <DynamicForm
        onSubmit={form.handleSubmit(onSubmit)}
        config={brandFormConfig}
        control={form.control}
        formState={form.formState}
        watch={form.watch}
        setValue={form.setValue}
        getValues={form.getValues}
        
        openInside="modal"
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title={editingBrand ? 'Edit Brand' : 'Add New Brand'}
        submitLabel={editingBrand ? 'Update Brand' : 'Create Brand'}
        modalSize="md"
      />
    </div>
  )
}