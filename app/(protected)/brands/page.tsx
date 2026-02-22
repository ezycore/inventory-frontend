"use client";
// Hooks & API
import { brandColumns } from "@/components/brands/columns";
import { brandFilterConfig } from "@/components/brands/filters";
import { brandFormConfig } from "@/components/brands/form-config";
import { prepareSubmitData } from "@/components/brands/helpers";
import { FieldSettingsLink } from "@/components/shared/field-settings-link";
import {
  brandsApi,
  useBrands,
  useCreateBrand,
  useDeleteBrand,
  useUpdateBrand,
} from "@/services/api";

import { useFilteredColumns, useFilteredFormConfig } from "@/hooks/use-filters";
import { queryKeys } from "@/services/api/query-keys";
import PageHeader from "@/ui/components/header";
import StatsCard from "@/ui/components/StatsCard";
import { DataCard } from "@/ui/components/dataCard";
import { Edit2, Eye, MoreVertical, Package, Trash2 } from "lucide-react";
import { Card } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Avatar, AvatarFallback } from "@/ui/components/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/ui/components/dropdown-menu";

const searchConfig = {
  globalSearch: true,
  placeholder: "Search brands by name, description, or status...",
};

const defaultValues = {
  name: "",
  description: "",
  images: [],
  status: "active" as const,
};

export default function BrandsPage() {
  const filteredFormConfig = useFilteredFormConfig(brandFormConfig, "brand");
  const filteredColumns = useFilteredColumns(brandColumns, "brand");
  const { data, isLoading } = useBrands();
  const { stats } = data || {};

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Brands Management"
        subTitle="Manage your product brands and their details."
        actions={<FieldSettingsLink module="brand" />}
      />

      {/* Stats Cards */}
      <StatsCard
        data={[
          { label: "Total Brands", value: stats?.total || 0, labelColor: "#3B82F6", color: "#3B82F6", bg: "#EFF6FF" },
          { label: "Active", value: stats?.active || 0, labelColor: "#10B981", color: "#10B981", bg: "#ECFDF5" },
          { label: "Inactive", value: stats?.inactive || 0, labelColor: "#F59E0B", color: "#F59E0B", bg: "#FFFBEB" },
          { label: "Total Products", value: stats?.totalProducts || 0, labelColor: "#8B5CF6", color: "#8B5CF6", bg: "#F5F3FF" },
        ]}
        isLoading={isLoading}
      />

      <DataCard
        cardTitle={(n) => `All Brands (${n})`}
        defaultPageSize={6}
        pageSizes={[6, 12, 24]}
        filterConfig={brandFilterConfig}
        // data={data?.items || []}
        module="product"
        loading={isLoading}
        cardSize="lg"
        fields={[
          {
            key: 'name',
            label: 'Brand name',
            isTitle: true
          },
          {
            key: 'description',
            label: 'Brand description',
            isSubtitle: true
          },
          {
            key: 'status',
            label: 'Status',
            isBadge: true,
            badgeVariant: (status: string) => status === 'active' ? 'default' : 'secondary'
          }
        ]}
        imageConfig={{
          src: (row) => row.images?.[0]?.url,
    fallback: (row) => row.name.substring(0, 2).toUpperCase(),
    position: "background",
        }}
        layoutConfig={{
          layout: "masonry",
          columns: { default: 1, sm: 2, lg: 3 },
          gap: "md",
        }}
        variant="detailed"
        searchConfig={searchConfig}
        selectable
        enableCardHover={false}
        // renderCard={(bra, { onEdit, onView, onDelete }) => {
        //   const { name, description, status, productCount, updatedAt, createdAt } = bra;
        //   const updatedDate = new Date(updatedAt).toLocaleDateString(undefined, {
        //     year: "numeric",
        //     month: "short",
        //     day: "numeric",
        //   });
        //   const createdDate = new Date(createdAt).toLocaleDateString(undefined, {
        //     year: "numeric",
        //     month: "short",
        //     day: "numeric",
        //   });
        //   return <Card className="p-5 hover:shadow-lg transition-all duration-200 group">
        //     <div className="flex items-start gap-4 mb-4">
        //       <Avatar className="h-12 w-12 rounded-lg">
        //         <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white">
        //           {name.substring(0, 2).toUpperCase()}
        //         </AvatarFallback>
        //       </Avatar>

        //       <div className="flex-1 min-w-0">
        //         <div className="flex items-center gap-2 mb-1">
        //           <h3 className="font-semibold text-lg truncate">{name}</h3>
        //           <Badge
        //             variant={status === 'active' ? 'default' : 'secondary'}
        //             className="text-xs shrink-0"
        //           >
        //             {status}
        //           </Badge>
        //         </div>
        //         {description && (
        //           <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
        //         )}
        //       </div>
        //       <DropdownMenu>
        //         <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-gray-100 transition-colors">
        //           <MoreVertical className="h-4 w-4" />
        //         </DropdownMenuTrigger>
        //         <DropdownMenuContent align="end">
        //           <DropdownMenuItem onClick={onView}>
        //             <Eye className="h-4 w-4 mr-2" />
        //             View
        //           </DropdownMenuItem>
        //           <DropdownMenuItem onClick={onEdit}>
        //             <Edit2 className="h-4 w-4 mr-2" />
        //             Edit
        //           </DropdownMenuItem>
        //           <DropdownMenuSeparator />
        //           <DropdownMenuItem variant="destructive" onClick={onDelete}>
        //             <Trash2 className="h-4 w-4 mr-2" />
        //             Delete
        //           </DropdownMenuItem>
        //         </DropdownMenuContent>
        //       </DropdownMenu>
        //     </div>


        //     <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
        //       <Package className="h-4 w-4" />
        //       <span>{productCount || 0} Products</span>
        //     </div>

        //     <div className="flex items-center justify-between pt-3 border-t text-xs text-gray-500">


        //       <div>Created: {createdDate}</div>
        //       {updatedDate && <div>Updated: {updatedDate}</div>}

        //     </div>
        //   </Card>;
        // }}
         customActions={[
    // Header action (Add button alternative)
    
    
    // Header action with onClick
    {
      type: "export",
      placement: "header",
      label: "Export",
    },
    {
      type: "export",
      placement: "menu",
      label: "Export",
    }
  ]}
        operations={{
          formConfig: brandFormConfig,
          defaultValues: defaultValues,
          getAllData: brandsApi.getAll,
          createMutation: useCreateBrand(),
          updateMutation: useUpdateBrand(),
          deleteMutation: useDeleteBrand(),
          queryKey: [...queryKeys.brands.all()],
          entityName: "Brand",
          isViewAvailable: true,
          prepareSubmitData,
          disabledFieldsInEdit: ['description']
        }}
        shadow="none"
        emptyMessage="ddd"
      />
    </div>
  );
}

{/* <DataTable
        cardTitle={(dataLength: number) => `All Brands (${dataLength})`}
        defaultPageSize={10}
        pageSizes={[2, 10, 20, 50, 100]}
        filterConfig={brandFilterConfig}
        columns={filteredColumns}
        manageColumns={true}
        module="brand"
        data={data?.items || []}
        selectable={true}
        searchConfig={searchConfig}
        enableSorting={true}
        defaultColumnVisibility={{ status: false }}
        enableRowHover={true}
        loading={isLoading}
        rowClassName={(row: Brand) =>
          row.status === "inactive" ? "bg-red-50 opacity-70" : ""
        }
        operations={{
          formConfig: filteredFormConfig,
          defaultValues: defaultValues,
          // getAllData: brandsApi.getAll,
          createMutation: useCreateBrand(),
          updateMutation: useUpdateBrand(),
          deleteMutation: useDeleteBrand(),
          disabledFieldsInEdit: ["name"],
          bulkDeleteMutation: useBulkDeleteBrand(),
          queryKey: [...queryKeys.brands.all()],
          entityName: "Brand",
          isViewAvailable: true,
          editTooltip: "Edit Brand",
          deleteTooltip: "Delete Brand",
          viewTooltip: "Custom tooltip View Brand",
          prepareSubmitData,
        }}
      /> */}