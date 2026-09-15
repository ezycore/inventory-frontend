"use client";
// coding-standard: maintained

import { invalidate } from "@/services/api/invalidation";
import { Suspense, useEffect, useState } from "react";
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
import { useNow } from "@/hooks/use-now";
import { ALL_TIME, PeriodSelect } from "@/components/shared/period-filter";
import { OrderInvoicePrintButton } from "@/components/ecommerce/order-invoice-print";
import { OrderRow } from "@/components/ecommerce/orders/order-row";
import { OrderConfirmDialog } from "@/components/ecommerce/orders/order-confirm-dialog";
import { CreateOrderDialog } from "@/components/ecommerce/orders/create-order-dialog";
import { LandingPageFilter } from "@/components/ecommerce/orders/landing-page-filter";
import {
  confirmableOrders,
  deletableOrders,
  getOrderStats,
  isTabActive,
  orderDetailHref,
  REJECTION_REASON_OPTIONS,
  rejectableOrders,
} from "@/components/ecommerce/orders/helpers";
import { ListPagination } from "@/components/ecommerce/list-pagination";
import { ListSearchInput } from "@/components/ecommerce/list-search-input";
import { cn } from "@/ui/lib/utils";
import { Card } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Checkbox } from "@/ui/components/checkbox";
import { Label } from "@/ui/components/label";
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
  // Shipped and Delivered each cover BOTH fulfillment branches — the server's
  // `ORDER_TABS` folds `ready_for_pickup` and `picked_up` into them. Before that
  // a pickup-only shop watched these two sit at zero forever.
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
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "";
  // Set only by the Orders count on Online Store → Pages; see `LandingPageFilter`.
  const pageId = searchParams.get("pageId") ?? undefined;
  const qc = useQueryClient();
  const currency = useAuthStore((s) => s.user?.organization?.currency);
  const canDelete = useHasPermission(PERMISSIONS.storefrontOrdersDelete);
  // One clock for the whole page — the Age column is relative, and a hook per
  // row would set a timer per row to answer the same question.
  const now = useNow();

  const [createOpen, setCreateOpen] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [courier, setCourier] = useState("all");
  const [fulfillment, setFulfillment] = useState("all");
  const [channel, setChannel] = useState("all");
  // Defaults to ALL_TIME, and that is the whole reason the shared filter takes
  // an `includeAllTime` flag: the dashboard opens on "today" because a summary
  // should, and a work queue that did the same would hide every unshipped order
  // older than this morning behind a filter nobody chose.
  const [period, setPeriod] = useState<OrderListPeriod | typeof ALL_TIME>(
    ALL_TIME,
  );
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkProvider, setBulkProvider] = useState("");
  // One answer for the whole selection, which is the honest shape: a merchant
  // clearing nine fake numbers is making one judgement, not nine.
  const [bulkReason, setBulkReason] = useState("");

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
  // Back to every page's orders, from the chip `LandingPageFilter` draws.
  const clearPageFilter = () => {
    setPage(1);
    setSelected(new Set());
    router.replace("/ecommerce/orders");
  };
  // No cast any more: the shared filter is generic over the period type, so the
  // pills and this handler are checked against `OrderListPeriod` end to end.
  const changePeriod = (v: OrderListPeriod | typeof ALL_TIME) => {
    setPeriod(v);
    // Leaving "custom" drops the dates with it, so switching to Today and back
    // does not silently re-apply a range the merchant can no longer see.
    if (v !== "custom") {
      setCustomStart("");
      setCustomEnd("");
    }
    setPage(1);
    setSelected(new Set());
  };
  const changeCustomStart = (v: string) => {
    setCustomStart(v);
    setPage(1);
    setSelected(new Set());
  };
  const changeCustomEnd = (v: string) => {
    setCustomEnd(v);
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
  // dates for `period=custom` and 400s on one, so it only goes on the wire once
  // the merchant has closed the range. ALL_TIME sends no `period` at all, which
  // is what "no date filter" means to `extractDateContext`.
  const customReady = !!customStart && !!customEnd;
  const dateParams =
    period === ALL_TIME || (period === "custom" && !customReady)
      ? {}
      : {
          period,
          ...(period === "custom" && {
            startDate: customStart,
            endDate: customEnd,
          }),
        };

  const { data, isLoading, isFetching } = useStorefrontOrders({
    status: status || undefined,
    search: search || undefined,
    courier: courier === "all" ? undefined : courier,
    fulfillmentType: fulfillment === "all" ? undefined : fulfillment,
    channel: channel === "all" ? undefined : channel,
    pageId,
    ...dateParams,
    page,
    limit,
  });

  const items = data?.items ?? [];
  const counts = data?.counts ?? {};
  const phoneHistory = data?.phoneHistory ?? {};
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
    if (rejectable.length === 0 || !bulkReason) return;
    setBulkBusy(true);
    const results = await Promise.allSettled(
      rejectable.map((o) =>
        storefrontOrdersApi.cancel(o._id, { reject: true, reason: bulkReason }),
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
    setBulkReason("");
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
    setBulkReason("");
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
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h2 className="text-base font-semibold">Right now</h2>
          {/* Only once a date filter is actually applied. These tiles are live
              pipeline BALANCES ("what is sitting unshipped") plus today's door
              outcomes — neither is a figure a date range can narrow, so they
              deliberately ignore the filter below. Unsaid, that reads as a stuck
              number: the merchant picks Last year, every tile holds still, and
              the obvious conclusion is that the page is broken. Said only when it
              can be misread, so it is not permanent furniture. */}
          {period !== ALL_TIME && (
            <span className="text-xs text-muted-foreground">
              Live balances and today&apos;s outcomes — not affected by the date
              filter
            </span>
          )}
        </div>
        <StatsCard
          data={getOrderStats(stats, currency)}
          isLoading={statsLoading}
          minCardWidth={280}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold">
            All Orders{" "}
            <span className="font-normal text-muted-foreground">
              ({counts.all ?? pagination?.total ?? 0})
            </span>
          </h2>
          {pageId ? <LandingPageFilter pageId={pageId} onClear={clearPageFilter} /> : null}
        </div>
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
          {/* The dropdown rendering, not the pills: this row already carries
              three selects and a search box, and seven pills overflowed it —
              see `PeriodSelect`. */}
          <PeriodSelect
            period={period}
            setPeriod={changePeriod}
            customStart={customStart}
            setCustomStart={changeCustomStart}
            customEnd={customEnd}
            setCustomEnd={changeCustomEnd}
            includeAllTime
          />
          <ListSearchInput
            // Names the PHONE, because the server has always searched it
            // (`shippingAddress.phone` is in the list query's `$or`) and nothing
            // said so. On a COD business the phone is the customer's identity —
            // it is what a buyer quotes on a follow-up call and the only handle a
            // guest order has — so the most useful thing this box does was the
            // one thing a merchant had no way to discover.
            placeholder="Search order #, customer or phone"
            onSearch={changeSearch}
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto border-b">
        {TABS.map((t) => {
          const active = isTabActive(t.value, status);
          // Straight off the server, which emits a total per TAB alongside the
          // per-status ones. This used to sum a client-side copy of the closed
          // set — a second definition of the grouping, and the one that goes
          // stale the day a status is added.
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
          {/* Every pending order in the selection is prepaid, so there is nothing
              this button could act on and it is not drawn. Silence would be the
              bug: the merchant selected orders they clearly meant to reject and
              the action simply is not there. The reason it is missing lives
              inside the dialog that cannot open, so it has to be said out here. */}
          {rejectable.length === 0 && prepaidSkipped > 0 && (
            <span className="text-xs text-muted-foreground">
              {prepaidSkipped === 1
                ? "The selected order has a prepayment — reject it from the row to decide about the money."
                : `All ${prepaidSkipped} selected orders have prepayments — reject them from the row to decide about the money.`}
            </span>
          )}
          {rejectable.length > 0 && (
            <OrderConfirmDialog
              destructive
              // Uncontrolled, but the close is still worth hearing: a reason
              // picked and then dismissed used to survive into the next order's
              // dialog, already enabling the action. One stray click then books a
              // reason nobody chose into the counts this field exists to produce.
              onOpenChange={(open) => {
                if (!open) setBulkReason("");
              }}
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
              actionDisabled={!bulkReason}
            >
              {/* Asked once for the whole selection. A merchant clearing nine
                  fake numbers is making one judgement, not nine, and asking per
                  order would make the bulk action slower than doing them singly. */}
              <div className="space-y-1.5">
                <Label htmlFor="bulk-reject-reason">
                  Why are you rejecting{" "}
                  {rejectable.length === 1 ? "it" : "them"}?
                </Label>
                <SimpleSelect
                  value={bulkReason}
                  onValueChange={setBulkReason}
                  options={REJECTION_REASON_OPTIONS}
                  placeholder="Pick a reason"
                  className="w-full"
                />
              </div>
            </OrderConfirmDialog>
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
                {/* Age, not Date — see `orderAge`. The exact timestamp is the
                    cell's `title`. */}
                <th className="px-3 py-3">Age</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Payment</th>
                {/* Courier is no longer its own column: it printed `—` on every
                    order not yet dispatched and now rides under Status. */}
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
                    statusLabel={labelFor(o.status)}
                    now={now}
                    buyerHistory={
                      o.shippingAddress?.phoneKey
                        ? phoneHistory[o.shippingAddress.phoneKey]
                        : undefined
                    }
                    onToggle={(on) => toggleOne(o._id, on)}
                    onOpen={() => router.push(orderDetailHref(o._id))}
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
