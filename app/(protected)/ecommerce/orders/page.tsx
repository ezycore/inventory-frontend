"use client";
// coding-standard: maintained

import { invalidate } from "@/services/api/invalidation";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  storefrontOrdersApi,
  useBulkConsignment,
  useCouriers,
  useOrderStats,
  useStorefrontOrders,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { OrderInvoicePrintButton } from "@/components/ecommerce/order-invoice-print";
import { OrderRow } from "@/components/ecommerce/orders/order-row";
import { getOrderStats } from "@/components/ecommerce/orders/helpers";
import { ListPagination } from "@/components/ecommerce/list-pagination";
import { ListSearchInput } from "@/components/ecommerce/list-search-input";
import { cn } from "@/ui/lib/utils";
import { Card } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Skeleton } from "@/ui/components/skeleton";
import StatsCard from "@/ui/components/StatsCard";

const TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Returned", value: "returned" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Rejected", value: "rejected" },
];

// Radix Select forbids an empty-string item value, so "all" is the clear-filter
// sentinel and maps to `undefined` (no filter) when the query is built.
/** Custom couriers are namespaced so an id can never collide with a provider name. */
const CUSTOM_PREFIX = "custom:";
const FULFILLMENT_OPTIONS = [
  { label: "All fulfillment", value: "all" },
  { label: "Delivery", value: "delivery" },
  { label: "Pickup", value: "pickup" },
];

export default function EcommerceOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-5">
          <Skeleton className="h-8 w-48" />
        </div>
      }
    >
      <OrdersList />
    </Suspense>
  );
}

function OrdersList() {
  const router = useRouter();
  const initialStatus = useSearchParams().get("status") ?? "";
  const qc = useQueryClient();
  const currency = useAuthStore((s) => s.user?.organization?.currency);

  const [status, setStatus] = useState(initialStatus);
  const [courier, setCourier] = useState("all");
  const [fulfillment, setFulfillment] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkProvider, setBulkProvider] = useState("");

  const { data: couriersData } = useCouriers();
  const enabledCouriers = (couriersData?.couriers ?? []).filter((c) => c.enabled);
  const customCouriers = (couriersData?.customCouriers ?? []).filter(
    (c) => c.active,
  );
  // One carrier list for both the filter and the bulk picker — integrated
  // providers first, then the merchant's own.
  const carrierOptions = [
    ...enabledCouriers.map((c) => ({
      label: `${c.provider[0].toUpperCase()}${c.provider.slice(1)} Courier`,
      value: c.provider,
    })),
    ...customCouriers.map((c) => ({
      label: c.name,
      value: `${CUSTOM_PREFIX}${c._id}`,
    })),
  ];
  const bulkConsign = useBulkConsignment();
  const { data: stats, isLoading: statsLoading } = useOrderStats();

  // View changes (search / tab / filter / page size / page) reset selection in
  // the handlers below, not in effects — synchronous setState in effects
  // cascades renders.
  const changeSearch = (v: string) => {
    setSearch(v);
    setPage(1);
    setSelected(new Set());
  };
  const changeStatus = (v: string) => {
    setStatus(v);
    setPage(1);
    setSelected(new Set());
  };
  const changeCourier = (v: string) => {
    setCourier(v);
    setPage(1);
    setSelected(new Set());
  };
  const changeFulfillment = (v: string) => {
    setFulfillment(v);
    setPage(1);
    setSelected(new Set());
  };
  const changeLimit = (n: number) => {
    setLimit(n);
    setPage(1);
    setSelected(new Set());
  };
  const goToPage = (p: number) => {
    setPage(p);
    setSelected(new Set());
  };

  const { data, isLoading, isFetching } = useStorefrontOrders({
    status: status || undefined,
    search: search || undefined,
    courier: courier === "all" ? undefined : courier,
    fulfillmentType: fulfillment === "all" ? undefined : fulfillment,
    page,
    limit,
  });

  const items = data?.items ?? [];
  const counts = data?.counts ?? {};
  const pagination = data?.pagination;

  const allChecked = items.length > 0 && items.every((o) => selected.has(o._id));
  const confirmable = items.filter(
    (o) => selected.has(o._id) && o.status === "pending",
  );
  // Dispatchable = selected, confirmed/processing, not already sent to a courier.
  // A manual dispatch may carry no consignment id, so its marker is the carrier
  // name — matching the backend's `isDispatched`.
  const dispatchable = items.filter(
    (o) =>
      selected.has(o._id) &&
      (o.status === "confirmed" || o.status === "processing") &&
      !o.courier?.consignmentId &&
      !o.courier?.name,
  );

  const toggleAll = (on: boolean) =>
    setSelected(on ? new Set(items.map((o) => o._id)) : new Set());
  const toggleOne = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const onBulkConfirm = async () => {
    if (confirmable.length === 0) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(
      confirmable.map((o) => storefrontOrdersApi.confirm(o._id)),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const fail = results.length - ok;
    if (ok) toast.success(`${ok} order${ok === 1 ? "" : "s"} confirmed`);
    if (fail) toast.error(`${fail} order${fail === 1 ? "" : "s"} could not be confirmed`);
    invalidate(qc, "order.confirmed");
    setSelected(new Set());
    setBulkBusy(false);
  };

  const onBulkDispatch = () => {
    if (!bulkProvider || dispatchable.length === 0) return;
    const isCustom = bulkProvider.startsWith(CUSTOM_PREFIX);
    bulkConsign.mutate(
      {
        orderIds: dispatchable.map((o) => o._id),
        provider: isCustom ? undefined : bulkProvider,
        customCourierId: isCustom
          ? bulkProvider.slice(CUSTOM_PREFIX.length)
          : undefined,
      },
      {
        onSuccess: (res) => {
          const { successful, failed } = res.data;
          if (successful)
            toast.success(`${successful} order${successful === 1 ? "" : "s"} dispatched`);
          if (failed)
            toast.error(`${failed} order${failed === 1 ? "" : "s"} could not be dispatched`);
          setSelected(new Set());
          setBulkProvider("");
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Online Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Orders placed through your storefront.
        </p>
      </div>

      {/* COD-cash stat cards */}
      <StatsCard
        data={getOrderStats(stats, currency)}
        isLoading={statsLoading}
        minCardWidth={280}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">
          All Orders{" "}
          <span className="font-normal text-muted-foreground">
            ({counts.all ?? pagination?.total ?? 0})
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <SimpleSelect
            value={courier}
            onValueChange={changeCourier}
            options={[
              // "all" is the clear-filter sentinel (Radix Select forbids an empty
              // value); "none" means never dispatched — pickup + not-yet-shipped.
              { label: "All couriers", value: "all" },
              ...carrierOptions,
              { label: "No courier", value: "none" },
            ]}
            className="h-9 w-40"
          />
          <SimpleSelect
            value={fulfillment}
            onValueChange={changeFulfillment}
            options={FULFILLMENT_OPTIONS}
            className="h-9 w-40"
          />
          <ListSearchInput
            placeholder="Search order # or customer"
            onSearch={changeSearch}
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => {
          const active = status === t.value;
          const count = counts[t.value || "all"];
          return (
            <button
              key={t.value || "all"}
              onClick={() => changeStatus(t.value)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {count != null && (
                <span className="text-xs text-muted-foreground/70">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary bg-primary/5 px-3.5 py-2.5">
          <span className="text-sm font-semibold text-primary">
            {selected.size} selected
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            disabled={confirmable.length === 0 || bulkBusy}
            onClick={onBulkConfirm}
          >
            Confirm{confirmable.length ? ` (${confirmable.length})` : ""}
          </Button>
          {dispatchable.length > 0 && carrierOptions.length > 0 ? (
            <div className="flex items-center gap-2">
              <SimpleSelect
                value={bulkProvider}
                onValueChange={setBulkProvider}
                options={carrierOptions}
                placeholder="Courier"
                className="h-9 w-40"
              />
              <Button
                size="sm"
                disabled={!bulkProvider || bulkConsign.isPending}
                onClick={onBulkDispatch}
              >
                Send to courier ({dispatchable.length})
              </Button>
            </div>
          ) : null}
          <OrderInvoicePrintButton
            orders={items.filter((o) => selected.has(o._id))}
          />
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden p-0 shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={allChecked}
                    onCheckedChange={(c) => toggleAll(c === true)}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Payment</th>
                <th className="px-3 py-3">Courier</th>
                <th className="px-3 py-3">Status</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={9} className="px-4 py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="text-sm font-semibold">No orders found</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Try adjusting your search or filters.
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((o) => (
                  <OrderRow
                    key={o._id}
                    order={o}
                    currency={currency}
                    checked={selected.has(o._id)}
                    onToggle={(on) => toggleOne(o._id, on)}
                    onOpen={() => router.push(`/ecommerce/orders/${o._id}`)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ListPagination
        page={page}
        totalPages={pagination?.totalPages ?? 1}
        limit={limit}
        isFetching={isFetching}
        onPageChange={goToPage}
        onLimitChange={changeLimit}
      />
    </div>
  );
}
