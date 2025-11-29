"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Badge } from "@ui/components/badge";

import {
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
} from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys-products";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  AlertTriangle,
  ExternalLink,
  Copy,
} from "lucide-react";
import type { Brand } from "@/types/products";
import DynamicForm from "@/ui/components/form";
import { useDynamicForm } from "@/hooks/use-dynamic-form";

import type { DynamicFormConfig } from "@/ui/components/form/type";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/ui/components/dataTable/index";

// Demo data for testing all features
const DEMO_BRANDS: Brand[] = [
  {
    _id: "1",
    name: "Apple",
    slug: "apple",
    description: "Technology and consumer electronics",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    status: "active",
    created_at: new Date("2024-01-15").toISOString(),
    updated_at: new Date("2024-11-20").toISOString(),
  },
  {
    _id: "2",
    name: "Samsung",
    slug: "samsung",
    description: "Electronics and mobile devices",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg",
    status: "active",
    created_at: new Date("2024-02-10").toISOString(),
    updated_at: new Date("2024-11-18").toISOString(),
  },
  {
    _id: "3",
    name: "Sony",
    slug: "sony",
    description: "Entertainment and electronics manufacturer",
    logo_url: "",
    status: "active",
    created_at: new Date("2024-03-05").toISOString(),
    updated_at: new Date("2024-10-25").toISOString(),
  },
  {
    _id: "4",
    name: "LG",
    slug: "lg",
    description: "Home appliances and electronics",
    logo_url: "",
    status: "inactive",
    created_at: new Date("2024-01-20").toISOString(),
    updated_at: new Date("2024-09-15").toISOString(),
  },
  {
    _id: "5",
    name: "Dell",
    slug: "dell",
    description: "Computer hardware and technology solutions",
    logo_url: "",
    status: "active",
    created_at: new Date("2024-04-12").toISOString(),
    updated_at: new Date("2024-11-22").toISOString(),
  },
  {
    _id: "6",
    name: "HP",
    slug: "hp",
    description: "Computers and printers",
    logo_url: "",
    status: "active",
    created_at: new Date("2024-05-08").toISOString(),
    updated_at: new Date("2024-11-10").toISOString(),
  },
  {
    _id: "7",
    name: "Lenovo",
    slug: "lenovo",
    description: "Personal computers and technology",
    logo_url: "",
    status: "active",
    created_at: new Date("2024-06-15").toISOString(),
    updated_at: new Date("2024-11-05").toISOString(),
  },
  {
    _id: "8",
    name: "Asus",
    slug: "asus",
    description: "Computer hardware and electronics",
    logo_url: "",
    status: "inactive",
    created_at: new Date("2024-02-28").toISOString(),
    updated_at: new Date("2024-08-30").toISOString(),
  },
  {
    _id: "9",
    name: "Acer",
    slug: "acer",
    description: "Laptops and computer products",
    logo_url: "",
    status: "active",
    created_at: new Date("2024-07-20").toISOString(),
    updated_at: new Date("2024-10-18").toISOString(),
  },
  {
    _id: "10",
    name: "Microsoft",
    slug: "microsoft",
    description: "Software and cloud computing",
    logo_url: "",
    status: "active",
    created_at: new Date("2024-03-25").toISOString(),
    updated_at: new Date("2024-11-15").toISOString(),
  },
  {
    _id: "11",
    name: "Google",
    slug: "google",
    description: "Search engine and technology services",
    logo_url: "",
    status: "active",
    created_at: new Date("2024-08-10").toISOString(),
    updated_at: new Date("2024-11-12").toISOString(),
  },
  {
    _id: "12",
    name: "Amazon",
    slug: "amazon",
    description: "E-commerce and cloud services",
    logo_url: "",
    status: "active",
    created_at: new Date("2024-09-05").toISOString(),
    updated_at: new Date("2024-11-08").toISOString(),
  },
  {
    _id: "13",
    name: "Xiaomi",
    slug: "xiaomi",
    description: "Consumer electronics and mobile devices",
    logo_url: "",
    status: "active",
    created_at: new Date("2024-04-18").toISOString(),
    updated_at: new Date("2024-10-20").toISOString(),
  },
  {
    _id: "14",
    name: "Huawei",
    slug: "huawei",
    description: "Telecommunications equipment",
    logo_url: "",
    status: "inactive",
    created_at: new Date("2024-05-22").toISOString(),
    updated_at: new Date("2024-07-14").toISOString(),
  },
  {
    _id: "15",
    name: "OnePlus",
    slug: "oneplus",
    description: "Premium smartphones",
    logo_url: "",
    status: "active",
    created_at: new Date("2024-06-30").toISOString(),
    updated_at: new Date("2024-11-01").toISOString(),
  },
  {
    _id: "16",
    name: "Nokia",
    slug: "nokia",
    description: "Telecommunications and mobile phones",
    logo_url: "",
    status: "active",
    created_at: new Date("2024-01-08").toISOString(),
    updated_at: new Date("2024-09-28").toISOString(),
  },
  {
    _id: "17",
    name: "Motorola",
    slug: "motorola",
    description: "Mobile phones and communication devices",
    logo_url: "",
    status: "active",
    created_at: new Date("2024-02-14").toISOString(),
    updated_at: new Date("2024-10-10").toISOString(),
  },
  {
    _id: "18",
    name: "Oppo",
    slug: "oppo",
    description: "Smartphones and accessories",
    logo_url: "",
    status: "active",
    created_at: new Date("2024-07-05").toISOString(),
    updated_at: new Date("2024-11-03").toISOString(),
  },
  {
    _id: "19",
    name: "Vivo",
    slug: "vivo",
    description: "Mobile phones and accessories",
    logo_url: "",
    status: "inactive",
    created_at: new Date("2024-08-18").toISOString(),
    updated_at: new Date("2024-09-20").toISOString(),
  },
  {
    _id: "20",
    name: "Realme",
    slug: "realme",
    description: "Budget smartphones",
    logo_url: "",
    status: "active",
    created_at: new Date("2024-09-25").toISOString(),
    updated_at: new Date("2024-11-07").toISOString(),
  },
];

export const columns: ColumnDef<Brand>[] = [
  {
    accessorKey: "name",
    header: "Brand Name",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-3">
          {row.original.logo_url ? (
            <div className="relative w-8 h-8 rounded overflow-hidden">
              <Image
                src={row.original.logo_url}
                alt={row.getValue("name")}
                fill
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

export const brandFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Brand Name",
      placeholder: "Enter brand name",
      required: true,
      columnSpan: 12,
      validation: {
        minLength: 2,
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
        url: true,
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
  const [useDemoData, setUseDemoData] = useState(true);
  const [selectedBrands, setSelectedBrands] = useState<Brand[]>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

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

  const { data: brands, isLoading, error } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  // Use useMemo to prevent state updates during render
  const brandsList = useMemo(() => {
    if (useDemoData) return DEMO_BRANDS;
    return (brands as any)?.data?.items || [];
  }, [useDemoData, brands]);

  const handleAddBrand = () => {
    setEditingBrand(null);
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

  const onSubmit = async (data: any) => {
    try {
      const dataWithSlug = {
        ...data,
        slug: generateSlug(data.name),
      };

      if (editingBrand) {
        await updateBrand.mutateAsync({
          id: editingBrand._id,
          ...dataWithSlug,
        });
        toast.success("Brand updated successfully");
      } else {
        await createBrand.mutateAsync(dataWithSlug);
        toast.success("Brand created successfully");
      }
      setIsAddModalOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.brands.all() });
    } catch (error) {
      toast.error(`Failed to ${editingBrand ? "update" : "create"} brand`);
    }
  };

  if (error && !useDemoData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error loading brands</h3>
          <p className="text-muted-foreground">Please try again later.</p>
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
            Testing all DataTable features with demo data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={useDemoData ? "default" : "outline"}
            onClick={() => setUseDemoData(!useDemoData)}
            size="sm"
          >
            {useDemoData ? "Using Demo Data" : "Using Real Data"}
          </Button>
          <Button onClick={handleAddBrand}>
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Button>
        </div>
      </div>

      {/* Feature Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Search className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Global Search</h3>
                <p className="text-xs text-muted-foreground">Search all columns</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Edit className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Actions Enabled</h3>
                <p className="text-xs text-muted-foreground">Edit, Delete, Clone</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Brands List with DataTable */}
      <Card>
        <CardHeader>
            <div>
              <CardTitle>All Brands ({brandsList.length})</CardTitle>
              <CardDescription>
                Testing: Global Search • Row Selection • Sorting • Pagination • Actions
              </CardDescription>
            </div>
        
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={brandsList}
            selectable={true}
            onSelectionChange={(selected) => {
              setSelectedBrands(selected);
              console.log("Selected brands:", selected);
            }}
            searchConfig={{
              globalSearch: true,
              placeholder: "🔍 Try searching: Apple, Samsung, active, inactive, etc...",
            }}
            actions={{
              editable: { tooltip: "Edit this brand" },
              deletable: { tooltip: "Delete this brand (with confirmation)" },
              viewable: { tooltip: "View brand details" },
              custom: [
                {
                  label: "Clone",
                  icon: <Copy className="h-4 w-4" />,
                  tooltip: "Duplicate this brand",
                  onClick: (brand) => {
                    toast.success(`Cloning: ${brand.name}`);
                    console.log("Clone brand:", brand);
                  },
                  variant: "outline",
                },
                {
                  label: "Share",
                  icon: <ExternalLink className="h-4 w-4" />,
                  tooltip: "Share brand link",
                  onClick: (brand) => {
                    toast.success(`Sharing: ${brand.name}`);
                    console.log("Share brand:", brand);
                  },
                  variant: "ghost",
                },
              ],
            }}
            onEdit={(brand) => {
              console.log("Edit brand:", brand);
              handleEditBrand(brand);
              toast.info(`Editing: ${brand.name}`);
            }}
            onDelete={async (brand) => {
              console.log("Delete brand:", brand);
              toast.success(`Deleted: ${brand.name}`);
              await new Promise((resolve) => setTimeout(resolve, 1000));
              if (!useDemoData) {
                await handleDeleteBrand(brand);
              }
            }}
            onView={(brand) => {
              console.log("View brand:", brand);
              toast.info(`Viewing: ${brand.name}`);
            }}
            enableSorting={true}
            enableColumnVisibility={true}
            defaultColumnVisibility={{ description: false }}
            enableRowHover={true}
            isLoading={!useDemoData && isLoading}
            toolbarAction={{
              label: "Add Brand",
              icon: <Plus className="h-4 w-4 mr-2" />,
              onClick: handleAddBrand,
              variant: "default",
            }}
            pagination={{
              pageIndex: pagination.pageIndex,
              pageSize: pagination.pageSize,
              pageSizeOptions: [5, 10, 15, 20, 50],
              manualPagination: false, // Client-side pagination for demo/local data
              onPaginationChange: (newPagination) => {
                // Only update state if component is mounted
                if (isMountedRef.current) {
                  console.log("Pagination changed:", newPagination);
                  setPagination(newPagination);
                }
              },
            }}
            rowClassName={(row) => (row.status === "inactive" ? "bg-red-50 opacity-70" : "")}
          />
        </CardContent>
      </Card>

      {/* Feature Testing Guide */}
      <Card>
        <CardHeader>
          <CardTitle>🧪 Feature Testing Guide</CardTitle>
          <CardDescription>Test all DataTable features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Global Search</h4>
                  <p className="text-xs text-muted-foreground">
                    Type Apple or inactive in search box - searches all columns
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-600">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Row Selection</h4>
                  <p className="text-xs text-muted-foreground">
                    Click checkboxes to select rows - try bulk delete
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Column Sorting</h4>
                  <p className="text-xs text-muted-foreground">
                    Click column headers to sort ascending/descending
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-orange-600">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Actions</h4>
                  <p className="text-xs text-muted-foreground">
                    Hover over rows to see Edit, Delete, View, Clone, Share buttons
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-pink-600">5</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Column Visibility</h4>
                  <p className="text-xs text-muted-foreground">
                    Click Columns button to show/hide columns
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-indigo-600">6</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Pagination</h4>
                  <p className="text-xs text-muted-foreground">
                    Change page size (5, 10, 15, 20, 50) and navigate pages
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-yellow-600">7</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Delete Confirmation</h4>
                  <p className="text-xs text-muted-foreground">
                    Click delete - see confirmation dialog before deletion
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-red-600">8</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Inactive Rows</h4>
                  <p className="text-xs text-muted-foreground">
                    Notice inactive brands have red background (custom styling)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>💡 Pro Tip:</strong> Open browser console to see all event logs (Edit,
              Delete, Clone, Share, Selection changes)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Brand Modal */}
      {/* <DynamicForm
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
        title={editingBrand ? "Edit Brand" : "Add New Brand"}
        submitLabel={editingBrand ? "Update Brand" : "Create Brand"}
        modalSize="md"
      /> */}
    </div>
  );
}
