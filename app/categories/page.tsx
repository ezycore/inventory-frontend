'use client'

import { useState } from 'react'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Skeleton } from '@ui/components/skeleton'

import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory 
} from '@/hooks/queries'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys-products'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2, Tag, AlertTriangle } from 'lucide-react'
import type { Category, CreateCategoryDto } from '@/types/products'
import { DynamicForm } from '@ui/components/form'
import { useDynamicForm } from '@/hooks/use-dynamic-form'
import { DynamicFormConfig } from '@/types/form'

const categoryFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: 'name',
      type: 'input',
      label: 'Category Name',
      placeholder: 'Enter category name',
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
      placeholder: 'Enter category description',
      rows: 3,
      columnSpan: 12,
      validation: {
        maxLength: 500
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
export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  // Form setup
  const defaultValues = editingCategory || { 
    name: '',
    description: '',
    status: 'active' as const
  }
  const { form } = useDynamicForm(categoryFormConfig, defaultValues)

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
  const { data: categories, isLoading, error } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  // Filter categories based on search
  const filteredCategories = ((categories as any)?.data?.items || []).filter((category: any) => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const handleAddCategory = () => {
    setEditingCategory(null)
    // Reset form to default values
    form.reset({
      name: '',
      description: '',
      status: 'active'
    })
    setIsAddModalOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    // Reset form with category data
    form.reset({
      name: category.name,
      description: category.description || '',
      status: category.status
    })
    setIsAddModalOpen(true)
  }

  const handleDeleteCategory = async (category: Category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await deleteCategory.mutateAsync(category._id)
        toast.success('Category deleted successfully')
      } catch (error) {
        toast.error('Failed to delete category')
      }
    }
  }

  const onSubmit = async (data: any) => {
    try {
      const dataWithSlug = {
        ...data,
        slug: generateSlug(data.name)
      }
      
      if (editingCategory) {
        await updateCategory.mutateAsync({ id: editingCategory._id, ...dataWithSlug })
        toast.success('Category updated successfully')
      } else {
        await createCategory.mutateAsync(dataWithSlug)
        toast.success('Category created successfully')
      }
      setIsAddModalOpen(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.category.all() })
    } catch (error) {
      toast.error(`Failed to ${editingCategory ? 'update' : 'create'} category`)
    }
  }

  const isSubmitting = createCategory.isPending || updateCategory.isPending

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error loading categories</h3>
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
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Organize your products with categories
          </p>
        </div>
        <Button onClick={handleAddCategory}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${filteredCategories.length} categories found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No categories found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first category'}
              </p>
              <Button onClick={handleAddCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category: any) => (
                <div key={category._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{category.name}</h3>
                      <Badge variant={category.status === 'active' ? 'default' : 'secondary'}>
                        {category.status}
                      </Badge>
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Created: {new Date(category.created_at).toLocaleDateString()}</span>
                      {category.updated_at && (
                        <span>Updated: {new Date(category.updated_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCategory(category)}
                      disabled={deleteCategory.isPending}
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

      {/* Add/Edit Category Modal */}
      <DynamicForm
        onSubmit={form.handleSubmit(onSubmit)}
        config={categoryFormConfig}
        control={form.control}
        formState={form.formState}
        watch={form.watch}
        setValue={form.setValue}
        getValues={form.getValues}
        
        openInside="modal"
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
        submitLabel={editingCategory ? 'Update Category' : 'Create Category'}
        modalSize="md"
      />
    </div>
  )
}