'use client';

import type { ColumnDef } from '@tanstack/react-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/ui/components/card';
import { BaseDataTable } from '@/ui/components/dataTable/base-data-table ';
import type { FilterConfig } from '@/types/DataTable';

interface PaginationInfo {
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ReturnHistoryTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading: boolean;
  filterConfig?: FilterConfig;
  paginationInfo?: PaginationInfo | null;
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

export function ReturnHistoryTable<TData>({
  columns,
  data,
  isLoading,
  filterConfig,
  paginationInfo,
  page,
  limit,
  setPage,
  setLimit,
}: ReturnHistoryTableProps<TData>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Returns</CardTitle>
        <CardDescription>
          {paginationInfo
            ? `${paginationInfo.total} return(s) found`
            : 'Loading...'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BaseDataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          filterConfig={filterConfig}
          searchConfig={{
            globalSearch: true,
            placeholder: 'Search returns...',
          }}
          actions={{}}
          pagination={{
            pageIndex: page - 1,
            pageSize: limit,
            totalPages: paginationInfo?.totalPages ?? 1,
            totalItems: paginationInfo?.total ?? 0,
            hasNext: paginationInfo?.hasNext ?? false,
            hasPrev: paginationInfo?.hasPrev ?? false,
            manualPagination: true,
            pageSizeOptions: [10, 20, 50, 100],
            onPaginationChange: ({ pageIndex, pageSize }) => {
              setPage(pageIndex + 1);
              if (pageSize !== limit) setLimit(pageSize);
            },
          }}
          enableSorting
        />
      </CardContent>
    </Card>
  );
}
