'use client';

import { useTranslations } from 'next-intl';
import type { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent } from '@/ui/components/card';
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
  const t = useTranslations('common.returns');
  return (
    <Card className="p-0">
      <CardContent className="p-6">
        <BaseDataTable
          title={t('returnsTitle')}
          columns={columns}
          data={data}
          isLoading={isLoading}
          filterConfig={filterConfig}
          searchConfig={{
            globalSearch: true,
            placeholder: t('searchReturns'),
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
