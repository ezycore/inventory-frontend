import { Brand } from "@/types";
import { FilterConfig } from "@/types/DataTable";
import { DateCell } from "@/ui/components/dataTable/cells";
import { AvatarCell } from "@/ui/components/dataTable/cells/avatar-cell";
import { DynamicFormConfig } from "@/ui/components/form/type";
import { ColumnDef } from "@tanstack/react-table";

// Form configuration
export const brandFormConfig: DynamicFormConfig = {
  fields: [
    {
      name: "name",
      type: "input",
      label: "Brand Name",
      placeholder: "Enter brand name",
      required: true,
      columnSpan: 12,
      validation: { minLength: 1, maxLength: 100 },
    },
    {
      name: "description",
      type: "textarea",
      label: "Description",
      placeholder: "Enter brand description",
      rows: 3,
      columnSpan: 12,
      validation: { maxLength: 500 },
    },
    {
      name: "images",
      type: "file-upload",
      label: "Brand Images",
      placeholder: "Upload brand images",
      columnSpan: 12,
      accept: "image/*",
      maxFiles: 1,
      maxSize: 5 * 1024 * 1024, // 5MB per file
      fileTypes: ["jpg", "jpeg", "png", "webp"],
      dropzoneText: "PNG, JPG, WEBP up to 5MB (max 5 images)",
      showPreview: true,
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      required: true,
      columnSpan: 12,
      defaultValue: "active",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ],
};

// Column definitions
export const brandColumns: ColumnDef<Brand>[] = [
  {
    accessorKey: "name",
    header: "Brand Name",
    cell: ({ row }) => {
      return (
        <AvatarCell
          imageUrl={row.original.images?.[0]?.thumbnailUrl}
          name={row.getValue("name")}
          isActive={row.original.status === "active"}
        />
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "createdAt",
    header: "Created Date",
    cell: ({ row }) => <DateCell value={row.getValue("createdAt")} />,
  },
  {
    accessorKey: "updatedAt",
    header: "Updated Date",
    cell: ({ row }) => <DateCell value={row.getValue("updatedAt")} />,
  },
];

// Filter configuration for brands
export const brandFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
      label: "Search brand",
      type: "text",
      placeholder: "Search by brand...",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
      columnSpan: 1,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
    {
      name: "createdAt",
      label: "Created Date",
      type: "date-range",
      placeholder: "Select date range",
      columnSpan: 2,
    },
    {
      name: "updatedAt",
      label: "Updated Date",
      type: "date",
      placeholder: "Select date",
      columnSpan: 2,
    },
  ],
  viewMode: "popover",
  columns: 2,
  applyOnChange: false,
  showResetButton: true,
  showApplyButton: true,
};

export const brandPrepareSubmitData = (
  data: Brand,
  isEdit: boolean,
  item?: Brand,
) => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("status", data.status);
  if (data.description) {
    formData.append("description", data.description);
  }

  if (isEdit && item) {
    // EDIT MODE: Handle image changes
    const existingImages = item.images || [];
    const currentImages = data.images || [];

    // Detect removed images (compare publicIds)
    const existingPublicIds = existingImages.map((img: any) => img.publicId);
    const currentPublicIds = currentImages
      .filter((img: any) => typeof img === "object" && img.publicId)
      .map((img: any) => img.publicId);

    const removedImageIds = existingPublicIds.filter(
      (id: string) => !currentPublicIds.includes(id),
    );

    if (removedImageIds.length > 0) {
      formData.append("removeImages", JSON.stringify(removedImageIds));
    }

    // Append new files (File objects) - use a type guard so currentImages narrows to File[]
    const newFiles = (currentImages as unknown[]).filter(
      (img): img is File => img instanceof File,
    );
    newFiles.forEach((file) => {
      formData.append("images", file);
    });
  } else {
    // ADD MODE: Upload new files
    if (data.images && Array.isArray(data.images)) {
      data.images.forEach((file: any) => {
        if (file instanceof File) {
          formData.append("images", file);
        }
      });
    }
  }

  return formData;
};
