'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, Tag, AlertTriangle, ExternalLink, Copy } from 'lucide-react'

// Types
import type { Category, ApiResponse, PaginatedResponse } from '@/types'

// UI Components
import { Button } from '@ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { DataTable } from '@/ui/components/dataTable/index'

// Hooks & API
import { useDeleteCategory } from '@/hooks/queries'
import { categoriesApi } from '@/lib/api-client'

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: "Category Name",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
            <Tag className="h-4 w-4 text-gray-400" />
          </div>
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return (
        <div className="max-w-[300px] truncate text-muted-foreground">
          {description || "—"}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={status === "active" ? "default" : "secondary"}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <span className="text-sm">{date.toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: "updated_at",
    header: "Updated Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("updated_at"));
      return <span className="text-sm text-muted-foreground">{date.toLocaleDateString()}</span>;
    },
  },
];

export default function CategoriesPage() {
  const [page, setPage] = useState(1); // 1-based pagination for backend
  const [limit, setLimit] = useState(10);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Fetch categories with pagination
  const { data: categoriesResponse, isLoading, error, refetch } = useQuery<ApiResponse<PaginatedResponse<Category>>>({
    queryKey: ['categories', page, limit],
    queryFn: () => categoriesApi.getAll({ page, limit }),
    placeholderData: (previousData) => previousData,
  });

  const deleteCategory = useDeleteCategory()

  // Extract categories data from response
  const categoriesData = useMemo(() => {
    return categoriesResponse?.data?.items || [];
  }, [categoriesResponse]);

  const handleAddCategory = () => {
    toast.info("Add category functionality will be implemented soon");
  };

  const handleEditCategory = (category: Category) => {
    toast.info(`Edit category "${category.name}" - functionality will be implemented soon`);
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      await deleteCategory.mutateAsync(category._id);
      toast.success("Category deleted successfully");
      if (isMountedRef.current) {
        refetch();
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete category");
    }
  };

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
      </div>

      {/* Stats Cards */}
      {categoriesResponse?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Categories</CardDescription>
              <div className="text-2xl font-bold">{categoriesResponse.data.total}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Current Page</CardDescription>
              <div className="text-2xl font-bold">{categoriesResponse.data.page}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Pages</CardDescription>
              <div className="text-2xl font-bold">{categoriesResponse.data.totalPages}</div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Items Per Page</CardDescription>
              <div className="text-2xl font-bold">{categoriesResponse.data.limit}</div>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Categories DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : (
              <>
                {categoriesResponse?.data && `${categoriesResponse.data.total} total categories`}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={categoriesData}
            isLoading={isLoading}
            selectable
            actions={{
              editable: { tooltip: "Edit this category" },
              deletable: { tooltip: "Delete this category" },
            }}
            onEdit={(category) => {
              handleEditCategory(category);
            }}
            onDelete={async (category) => {
              await handleDeleteCategory(category);
            }}
            pagination={{
              pageIndex: page - 1, // Convert 1-based to 0-based
              pageSize: limit,
              totalPages: categoriesResponse?.data?.totalPages,
              totalItems: categoriesResponse?.data?.total,
              hasNext: categoriesResponse?.data?.hasNext,
              hasPrev: categoriesResponse?.data?.hasPrev,
              manualPagination: true,
              onPaginationChange: (newPagination) => {
                if (isMountedRef.current) {
                  setPage(newPagination.pageIndex + 1); // Convert 0-based to 1-based
                  setLimit(newPagination.pageSize);
                }
              },
              pageSizeOptions: [5, 10, 15, 20, 50],
            }}
            searchConfig={{
              globalSearch: true,
              placeholder: "🔍 Search categories by name, description, or status...",
            }}
            toolbarAction={{
              label: "Add Category",
              onClick: handleAddCategory,
              icon: <Plus className="h-4 w-4" />,
            }}
            rowClassName={(row) => (row.status === "inactive" ? "bg-red-50 opacity-70" : "")}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Category Modal */}
      {/* Note: DynamicForm integration temporarily disabled - needs review */}
      {/* Will implement add/edit functionality in next iteration */}
    </div>
  )
}