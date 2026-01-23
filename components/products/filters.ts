import { FilterConfig } from '@/types/DataTable'
import { ProductStatus } from '@/types'

export const productFilterConfig: FilterConfig = {
  fields: [
    {
      name: "name",
      label: "Search product",
      type: "text",
      placeholder: "Search by product name...",
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
