import { ProductStatus } from "@/types";
import { FilterConfig } from "@/types/DataTable";

export const productFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
      label: "Search product",
      type: "text",
      placeholder: "Search by product name...",
    },
    {
      name: "brandId",
      label: "Filter by Brand",
      type: "select",
      placeholder: "All brands",
      optionsApi: "/brands?all=true&fields=_id,name", // API endpoint to fetch brand options
    },
    {
      name: "categoryId",
      label: "Filter by Category",
      type: "select",
      placeholder: "All categories",
      optionsApi: "/categories?all=true&fields=_id,name", // API endpoint to fetch category options
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      placeholder: "All statuses",
      options: [
        { label: "Active", value: ProductStatus.ACTIVE },
        { label: "Inactive", value: ProductStatus.INACTIVE },
        { label: "Archived", value: ProductStatus.ARCHIVED },
      ],
    },
  ],
};
