"use client";
// coding-standard: maintained

import { useState } from "react";
import { useTranslations } from "next-intl";

import { ListSearchInput } from "@/components/ecommerce/list-search-input";
import { LIST_PAGE_SIZES, ListPagination } from "@/components/ecommerce/list-pagination";
import { useFormatters } from "@/hooks/use-formatters";
import { useListUrlState } from "@/hooks/use-list-url-state";
import { useWarrantyClaims, type WarrantyClaim, type WarrantyClaimStatus } from "@/services/api";
import { Badge } from "@/ui/components/badge";
import { Card } from "@/ui/components/card";
import { SimpleSelect } from "@/ui/components/simple-select";
import { SimpleTable, type SimpleColumn } from "@/ui/components/simple-table";
import { Skeleton } from "@/ui/components/skeleton";
import { ClaimDetailSheet } from "./claim-detail-sheet";
import { CLAIM_STATUSES, claimStatusTone } from "./claim-status";

/**
 * Warranty claims at the active location — status filter, search, pager, and
 * the detail sheet a row opens. Page and filters live in the URL (`tab` is
 * the page's own param, so this list takes a prefix).
 */
export function ClaimsList() {
  const t = useTranslations("sales.warranty");
  const { formatDate } = useFormatters();
  const list = useListUrlState({
    prefix: "claims_",
    defaults: { limit: 20, filters: { status: "all", search: "" } },
    limitOptions: LIST_PAGE_SIZES,
  });
  const { page, limit } = list;
  const { status, search } = list.filters;
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useWarrantyClaims({
    page,
    limit,
    status: status === "all" ? undefined : (status as WarrantyClaimStatus),
    search: search || undefined,
  });
  const claims = data?.items ?? [];

  const columns: SimpleColumn<WarrantyClaim>[] = [
    { key: "claim", header: t("claims.columns.claim"), cell: (c) => <span className="font-medium">{c.claimNumber}</span> },
    { key: "invoice", header: t("claims.columns.invoice"), cell: (c) => c.invoiceNumber },
    {
      key: "product",
      header: t("claims.columns.product"),
      cell: (c) => (
        <div className="space-y-0.5">
          <div>{c.productName}</div>
          {!c.coveredAtIntake && (
            <div className="text-xs text-destructive">{t("claims.outOfWarranty")}</div>
          )}
        </div>
      ),
    },
    { key: "customer", header: t("claims.columns.customer"), cell: (c) => c.customerId?.name ?? "—" },
    { key: "quantity", header: t("claims.columns.quantity"), align: "right", cell: (c) => c.quantity },
    {
      key: "status",
      header: t("claims.columns.status"),
      cell: (c) => <Badge variant={claimStatusTone(c.status)}>{t(`status.${c.status}`)}</Badge>,
    },
    { key: "date", header: t("claims.columns.date"), cell: (c) => formatDate(c.createdAt) },
  ];

  return (
    <>
      <Card className="overflow-hidden p-0 shadow-none">
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <ListSearchInput
            key={list.revision}
            defaultValue={search}
            placeholder={t("claims.search")}
            onSearch={(value) => list.patchFilters({ search: value })}
            className="w-full sm:w-72"
          />
          <SimpleSelect
            value={status}
            onValueChange={(value) => list.patchFilters({ status: value })}
            className="w-48"
            options={[
              { label: t("claims.allStatuses"), value: "all" },
              ...CLAIM_STATUSES.map((value) => ({ label: t(`status.${value}`), value })),
            ]}
          />
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : claims.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {search || status !== "all" ? t("claims.noMatch") : t("claims.empty")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <SimpleTable
              columns={columns}
              rows={claims}
              getRowKey={(c) => c._id}
              onRowClick={(c) => setOpenId(c._id)}
            />
          </div>
        )}

        {(data?.totalPages ?? 0) > 0 && (
          <div className="border-t py-3">
            <ListPagination
              page={data?.page ?? page}
              totalPages={data?.totalPages ?? 1}
              limit={limit}
              total={data?.total}
              onPageChange={list.setPage}
              onLimitChange={list.setLimit}
              isFetching={isFetching}
            />
          </div>
        )}
      </Card>

      <ClaimDetailSheet claimId={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
