"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Plus,
  Star,
  AlertTriangle,
} from "lucide-react";

// Types
import type { Brand, ApiResponse, PaginatedResponse } from "@/types";
import type { DynamicFormConfig } from "@/ui/components/form/type";

// UI Components
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { DataTable } from "@/ui/components/dataTable/index";
import DynamicForm from "@/ui/components/form";

// Hooks & API
import {
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
} from "@/hooks/queries";
import { useDynamicForm } from "@/hooks/use-dynamic-form";
import { brandsApi } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys-products";
import { SafeImage } from "@/ui/components/safeImage";

const columns: ColumnDef<Brand>[] = [
  {
    accessorKey: "name",
    header: "Brand Name",
    cell: ({ row }) => {
      const isLogoUrlAvailable = "logo_url" in row.original;
      const logoUrl = isLogoUrlAvailable && row.original.logo_url ? row.original.logo_url : null;
      const isActive = row.original.status === "active";
      return (
        <div className="flex items-center gap-3">
          { isLogoUrlAvailable && logoUrl ? (
            <div className="relative w-8 h-8 rounded overflow-hidden">
              <SafeImage
                src={logoUrl}
                alt={row.getValue("name")}
                fill={true}
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          ) : (
            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
              <Star className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <span className={`font-medium ${isActive ? "text-green-600" : "text-red-600"} capitalize`}>{row.getValue("name")}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return <span className="text-sm">{date.toLocaleDateString()}</span>;
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"));
      return <span className="text-sm text-muted-foreground">{date.toLocaleDateString()}</span>;
    },
  },
];

const brandFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Brand Name",
      placeholder: "Enter brand name",
      required: true,
      columnSpan: 12,
      validation: {
        minLength: 1,
        maxLength: 100,
      },
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      placeholder: "Enter brand description",
      rows: 3,
      columnSpan: 12,
      validation: {
        maxLength: 500,
      },
    },
    {
      name: "logo_url",
      type: "input",
      label: "Logo URL",
      placeholder: "https://example.com/logo.png",
      columnSpan: 12,
      validation: {
        url: true
      },
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 12,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};

export default function BrandsPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  
  // Backend pagination state (1-based)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(2);

  // Track if component is mounted to prevent state updates during render
  const isMountedRef = useRef(false);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const defaultValues = editingBrand || {
    name: "",
    description: "",
    logo_url: "",
    status: "active" as const,
  };
  const { form } = useDynamicForm(brandFormConfig, defaultValues);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // Fetch brands with pagination
  const { data: brandsResponse, isLoading, error, refetch } = useQuery<ApiResponse<PaginatedResponse<Brand>>>({
    queryKey: ['brands', page, limit],
    queryFn: () => brandsApi.getAll({ page, limit }),
    placeholderData: (previousData) => previousData, // Replace keepPreviousData in React Query v5
  });

  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  // Extract brands data from response
  const brandsData = useMemo(() => {
    return brandsResponse?.data?.items || [];
  }, [brandsResponse]);
  console.log("branData", brandsData)
  const handleAddBrand = () => {
    setEditingBrand(null);
    setIsViewMode(false);
    form.reset({
      name: "",
      description: "",
      logo_url: "",
      status: "active",
    });
    setIsAddModalOpen(true);
  };
  

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setIsViewMode(false);
    form.reset({
      name: brand.name,
      description: brand.description || "",
      logo_url: brand.logo_url || "",
      status: brand.status,
    });
    setIsAddModalOpen(true);
  };

  const handleViewBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setIsViewMode(true);
    form.reset({
      name: brand.name,
      description: brand.description || "",
      logo_url: brand.logo_url || "",
      status: brand.status,
    });
    setIsAddModalOpen(true);
  };

  const handleDeleteBrand = async (brand: Brand) => {
    try {
      await deleteBrand.mutateAsync(brand._id);
      toast.success("Brand deleted successfully");
    } catch (error) {
      toast.error("Failed to delete brand");
    }
  };

  // Prepare data for submission
  const prepareSubmitData = (data: any) => {
    const dataWithSlug = {
      ...data,
      slug: generateSlug(data.name),
    };

    // If editing, include the ID
    if (editingBrand) {
      return {
        id: editingBrand._id,
        ...dataWithSlug,
      };
    }
    return dataWithSlug;
  };

  // Determine which mutation hook to use
  const mutationHook = editingBrand ? updateBrand : createBrand;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error loading brands</h3>
          <p className="text-muted-foreground">
            {(error as Error).message || "Please try again later."}
          </p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Brands Management</h1>
          <p className="text-muted-foreground">
            Manage your product brands.
          </p>
        </div>
      </div>

      {/* Brands List with DataTable */}
      <Card>
        <CardHeader>
          <CardTitle>All Brands ({brandsResponse?.data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={brandsData}
            selectable={true}
            searchConfig={{
              globalSearch: true,
              placeholder: "Search brands by name, description, or status...",
            }}
            actions={{
              editable: { tooltip: "Edit this brand" },
              deletable: { tooltip: "Delete this brand" },
              viewable: { tooltip: "View brand details" },
            }}
            onEdit={(brand) => {
              handleEditBrand(brand);
            }}
            onDelete={async (brand) => {
              await handleDeleteBrand(brand);
            }}
            onView={(brand) => {
              handleViewBrand(brand);
            }}
            enableSorting={true}
            defaultColumnVisibility={{ status: false }}
            enableRowHover={true}
            isLoading={isLoading}
            toolbarAction={{
              label: "Add Brand",
              icon: <Plus className="h-4 w-4" />,
              onClick: handleAddBrand,
              variant: "default",
            }}
            pagination={{
              pageIndex: page - 1, // Convert 1-based to 0-based
              pageSize: limit,
              totalPages: brandsResponse?.data?.totalPages,
              totalItems: brandsResponse?.data?.total,
              hasNext: brandsResponse?.data?.hasNext,
              hasPrev: brandsResponse?.data?.hasPrev,
              manualPagination: true, // Server-side pagination
              pageSizeOptions: [2, 5, 10, 20, 50, 100],
              onPaginationChange: (newPagination) => {
                if (isMountedRef.current) {
                  setPage(newPagination.pageIndex + 1); // Convert 0-based to 1-based
                  setLimit(newPagination.pageSize);
                }
              },
            }}
            rowClassName={(row) => (row.status === "inactive" ? "bg-red-50 opacity-70" : "")}
          />
        </CardContent>
      </Card>

      {/* Add/Edit/View Brand Modal */}
      <DynamicForm
        form={form}
        config={brandFormConfig}
        mutationHook={mutationHook}
        onSubmit={prepareSubmitData}
        openInside="modal"
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title={isViewMode ? "View Brand" : editingBrand ? "Edit Brand" : "Add New Brand"}
        submitLabel={editingBrand ? "Update Brand" : "Create Brand"}
        modalSize="md"
        viewMode={isViewMode}
        onSuccess={(result, data) => {
          toast.success(`Brand ${editingBrand ? "updated" : "created"} successfully`);
          setIsAddModalOpen(false);
          queryClient.invalidateQueries({ queryKey: queryKeys.brands.all() });
          refetch();
        }}
        onFailed={(error, data) => {
          toast.error(`Failed to ${editingBrand ? "update" : "create"} brand`);
        }}
      />
    </div>
  );
}
