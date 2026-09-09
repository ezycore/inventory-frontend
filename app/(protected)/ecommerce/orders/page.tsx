"use client";
// coding-standard: maintained

import { invalidate } from "@/services/api/invalidation";
import { Suspense, useEffect, useState } from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  storefrontOrdersApi,
  type OrderListPeriod,
  useBulkConsignment,
  useCouriers,
  useOrderStats,
  useStorefrontOrders,
} from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { useOrderStatusLabels } from "@/hooks/use-order-status-labels";
import { PERMISSIONS, useHasPermission } from "@/hooks/use-has-permission";
import { OrderInvoicePrintButton } from "@/components/ecommerce/order-invoice-print";
import { OrderRow } from "@/components/ecommerce/orders/order-row";
import { OrderConfirmDialog } from "@/components/ecommerce/orders/order-confirm-dialog";
import { CreateOrderDialog } from "@/components/ecommerce/orders/create-order-dialog";
import {
  CLOSED_STATUSES,
  confirmableOrders,
  deletableOrders,
  getOrderStats,
  isTabActive,
  rejectableOrders,
} from "@/components/ecommerce/orders/helpers";
import { ListPagination } from "@/components/ecommerce/list-pagination";
import { ListSearchInput } from "@/components/ecommerce/list-search-input";
import { cn } from "@/ui/lib/utils";
import { Card } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import { DateRangePicker } from "@/ui/components/date-range-picker";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Skeleton } from "@/ui/components/skeleton";
import StatsCard from "@/ui/components/StatsCard";

// Tab labels come from the org's step wording at render time (merchants may
// rename the pipeline steps); "All" and the terminal states are never renameable,
// so they carry their own fixed label.
const TABS: { label?: string; value: string }[] = [
  { label: "All", value: "" },
  { value: "pending" },
  { value: "confirmed" },
  { value: "processing" },
  { value: "shipped" },
  { value: "delivered" },
  // Was three tabs. A merchant scanning the strip is asking "what needs me?",
  // and three separate ways to say "nothing" pushed the answer off the end of a
  // laptop screen on the workspaces that reject the most.
  { label: "Closed", value: "closed" },
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
/**
 * The date presets, resolved server-side against the ORG's timezone — the reason
 * this sends a preset name rather than two dates the browser computed. A Dhaka
 * merchant asking for "today" at 1am means their today, and `new Date()` in the
 * browser of a staffer travelling abroad does not.
 *
 * "all" is the clear-filter sentinel, and it is the DEFAULT: an order queue shows
 * everything until asked otherwise. A report may default to a month; a work list
 * that hid last week's unshipped order would be lying about what is outstanding.
 *
 * Every preset the server accepts is offered — the annotation is what keeps that
 * true. `OrderListPeriod` comes from the generated spec, so a preset renamed or
 * dropped on the backend fails to compile here instead of reaching a merchant as
 * an empty list (the server 400s an unknown `period`, and nothing on this screen
 * would show the error).
 */
const PERIOD_OPTIONS: { label: string; value: OrderListPeriod | "all" }[] = [
  { label: "All time", value: "all" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This week", value: "thisWeek" },
  { label: "Last week", value: "lastWeek" },
  { label: "This month", value: "thisMonth" },
  { label: "Last month", value: "lastMonth" },
  { label: "Last 6 months", value: "last6Months" },
  { label: "This year", value: "thisYear" },
  { label: "Last year", value: "lastYear" },
  { label: "Custom range", value: "custom" },
];

/** Mirrors the backend enum; "all" is the clear-filter sentinel like the others. */
const CHANNEL_OPTIONS = [
  { label: "All channels", value: "all" },
  { label: "Website", value: "website" },
  { label: "Messenger", value: "messenger" },
  { label: "WhatsApp", value: "whatsapp" },
  { label: "Instagram", value: "instagram" },
  { label: "Post comment", value: "comment" },
  { label: "Phone call", value: "phone" },
  { label: "Other", value: "manual" },
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
  const canDelete = useHasPermission(PERMISSIONS.storefrontOrdersDelete);

  const [createOpen, setCreateOpen] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [courier, setCourier] = useState("all");
  const [fulfillment, setFulfillment] = useState("all");
  const [channel, setChannel] = useState("all");
  const [period, setPeriod] = useState<OrderListPeriod | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkProvider, setBulkProvider] = useState("");

  const { data: couriersData } = useCouriers();
  const enabledCouriers = (couriersData?.couriers ?? []).filter(
    (c) => c.enabled,
  );
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
  const changeChannel = (v: string) => {
    setChannel(v);
    setPage(1);
    setSelected(new Set());
  };
  const changePeriod = (v: string) => {
    // `SimpleSelect` hands back a bare string, but it only ever renders
    // `PERIOD_OPTIONS`, whose values are checked against the generated enum — so
    // the narrowing is true by construction, and it is what carries the type
    // down to the request rather than losing it at this boundary.
    setPeriod(v as OrderListPeriod | "all");
    // Leaving "custom" drops the range with it, so switching to "Today" and back
    // does not silently re-apply dates the merchant can no longer see.
    if (v !== "custom") setDateRange(undefined);
    setPage(1);
    setSelected(new Set());
  };
  const changeDateRange = (r: DateRange | undefined) => {
    setDateRange(r);
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

  const { labelFor } = useOrderStatusLabels();

  // A half-picked custom range is not a filter yet — the server demands both
  // dates for `period=custom` and 400s on one, so the range only goes on the wire
  // once the merchant has closed it.
  const customReady = !!dateRange?.from && !!dateRange?.to;
  const dateParams =
    period === "all" || (period === "custom" && !customReady)
      ? {}
      : {
          period,
          ...(period === "custom" && {
            startDate: format(dateRange!.from!, "yyyy-MM-dd"),
            endDate: format(dateRange!.to!, "yyyy-MM-dd"),
          }),
        };

  const { data, isLoading, isFetching } = useStorefrontOrders({
    status: status || undefined,
    search: search || undefined,
    courier: courier === "all" ? undefined : courier,
    fulfillmentType: fulfillment === "all" ? undefined : fulfillment,
    channel: channel === "all" ? undefined : channel,
    ...dateParams,
    page,
    limit,
  });

  const items = data?.items ?? [];
  const counts = data?.counts ?? {};
  const pagination = data?.pagination;

  const allChecked =
    items.length > 0 && items.every((o) => selected.has(o._id));
  // All three sets are pure and live in `helpers.ts`, so the row menu applies the
  // same rules the bulk bar counts by — see `isDeletableOrder`.
  const confirmable = confirmableOrders(items, selected);
  const rejectable = rejectableOrders(items, selected);
  const prepaidSkipped = confirmable.length - rejectable.length;
  const deletable = canDelete ? deletableOrders(items, selected) : [];
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
    if (fail)
      toast.error(
        `${fail} order${fail === 1 ? "" : "s"} could not be confirmed`,
      );
    invalidate(qc, "order.confirmed");
    setSelected(new Set());
    setBulkBusy(false);
  };

  const onBulkReject = async () => {
    if (rejectable.length === 0) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(
      rejectable.map((o) =>
        storefrontOrdersApi.cancel(o._id, { reject: true }),
      ),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const fail = results.length - ok;
    if (ok) toast.success(`${ok} order${ok === 1 ? "" : "s"} rejected`);
    if (fail)
      toast.error(
        `${fail} order${fail === 1 ? "" : "s"} could not be rejected`,
      );
    // Same event the single-order path fires (`useCancelOrder`): a reject
    // releases the stock hold and gives the coupon back, so STOCK and MONEY
    // both move — `order.changed` alone would leave sellable stock stale.
    invalidate(qc, "order.returned");
    setSelected(new Set());
    setBulkBusy(false);
  };

  const onBulkDelete = async () => {
    if (deletable.length === 0) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(
      deletable.map((o) => storefrontOrdersApi.remove(o._id)),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const fail = results.length - ok;
    if (ok) toast.success(`${ok} order${ok === 1 ? "" : "s"} deleted`);
    // A refusal here is the server catching what the client-side filter could
    // not see — a row that moved since the page loaded. Worth naming rather
    // than reporting a bare count.
    if (fail)
      toast.error(
        `${fail} order${fail === 1 ? "" : "s"} could not be deleted — open ${fail === 1 ? "it" : "them"} to see why`,
      );
    invalidate(qc, "order.changed");
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
            toast.success(
              `${successful} order${successful === 1 ? "" : "s"} dispatched`,
            );
          if (failed)
            toast.error(
              `${failed} order${failed === 1 ? "" : "s"} could not be dispatched`,
            );
          setSelected(new Set());
          setBulkProvider("");
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Online Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Orders from your storefront, and the ones you took in chat or by
            phone.
          </p>
        </div>
        {/* Most of an f-commerce merchant's volume never touches the website, so
            this is not a secondary action — it is how the majority of orders get
            onto the courier/COD pipeline at all. */}
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create order
        </Button>
      </div>
      <CreateOrderDialog open={createOpen} onOpenChange={setCreateOpen} />

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
          <SimpleSelect
            value={channel}
            onValueChange={changeChannel}
            options={CHANNEL_OPTIONS}
            className="h-9 w-40"
          />
          <SimpleSelect
            value={period}
            onValueChange={changePeriod}
            options={PERIOD_OPTIONS}
            className="h-9 w-40"
          />
          {period === "custom" && (
            <div className="w-64">
              <DateRangePicker
                value={dateRange}
                onChange={changeDateRange}
                placeholder="Pick dates"
              />
            </div>
          )}
          <ListSearchInput
            placeholder="Search order # or customer"
            onSearch={changeSearch}
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => {
          const active = isTabActive(t.value, status);
          const count =
            t.value === "closed"
              ? CLOSED_STATUSES.reduce((sum, s) => sum + (counts[s] ?? 0), 0)
              : counts[t.value || "all"];
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
              {t.label ?? labelFor(t.value)}
              {count != null && (
                <span className="text-xs text-muted-foreground/70">
                  {count}
                </span>
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
          {/* Every action here is HIDDEN when its own count is zero, never shown
              disabled. On the Closed tab a selection of fourteen orders offered a
              greyed-out Confirm and Reject beside a live Delete — three buttons,
              two behaviours, and two of them permanently dead on the tab a
              merchant reaches for most. A button that is only ever inert on this
              view is teaching them to stop reading the bar. */}
          {confirmable.length > 0 && (
            <Button size="sm" disabled={bulkBusy} onClick={onBulkConfirm}>
              Confirm ({confirmable.length})
            </Button>
          )}
          {/* The other half of triage. Rejecting mails the shopper, so the count
              and that consequence are both named before it runs — a bulk action
              that notifies N customers is not one to fire off a single click. */}
          {rejectable.length > 0 && (
            <OrderConfirmDialog
              destructive
              trigger={
                <Button variant="outline" size="sm" disabled={bulkBusy}>
                  Reject ({rejectable.length})
                </Button>
              }
              title={`Reject ${rejectable.length} order${rejectable.length === 1 ? "" : "s"}?`}
              // No stock clause here, unlike the single-order dialog: this button
              // only ever acts on `pending` orders, and a pending order has never
              // reserved anything — `confirmOrder` is what reserves. Promising a
              // release that cannot happen is what put a wrong line in the QA doc.
              description={`Each shopper is notified their order was rejected. No sale has been booked yet. This can't be undone.${
                prepaidSkipped
                  ? ` ${prepaidSkipped} selected order${
                      prepaidSkipped === 1
                        ? " has a prepayment and is"
                        : "s have prepayments and are"
                    } skipped — reject ${prepaidSkipped === 1 ? "it" : "them"} from the row to decide about the money.`
                  : ""
              }`}
              actionLabel={`Reject ${rejectable.length} order${rejectable.length === 1 ? "" : "s"}`}
              onConfirm={onBulkReject}
            />
          )}
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
          {/* Admin-only, and only ever offered for rows that will actually go —
              a Delete button that mostly refuses teaches the merchant to ignore
              it. Hidden entirely rather than disabled when nothing qualifies. */}
          {deletable.length > 0 && (
            <OrderConfirmDialog
              destructive
              trigger={
                <Button variant="outline" size="sm" disabled={bulkBusy}>
                  Delete ({deletable.length})
                </Button>
              }
              title={`Delete ${deletable.length} order${deletable.length === 1 ? "" : "s"} permanently?`}
              description={`${deletable.length === 1 ? "It is" : "They are"} removed for good — this can't be undone. A record of each order number, customer and total is kept in case a customer asks later.`}
              actionLabel={`Delete ${deletable.length} order${deletable.length === 1 ? "" : "s"}`}
              onConfirm={onBulkDelete}
            />
          )}
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
                {/* Copy-tracking-link column — deliberately unlabelled, like the
                    chevron: the icon and its tooltip carry the meaning. */}
                <th className="w-10" />
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={10} className="px-4 py-3">
                      <Skeleton className="h-5 w-full" />
                    </td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
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
                    statusLabel={labelFor(o.status)}
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
        total={pagination?.total}
        limit={limit}
        isFetching={isFetching}
        onPageChange={goToPage}
        onLimitChange={changeLimit}
      />
    </div>
  );
}
